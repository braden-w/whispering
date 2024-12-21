import {
	BubbleErr,
	Err,
	Ok,
	tryAsyncBubble,
	tryAsyncWhispering,
	trySyncBubble,
	WhisperingErr,
} from '@repo/shared';
import { mediaStream } from './mediaStream.svelte';
import { toast } from 'svelte-sonner';
import { invoke } from '@tauri-apps/api/core';
import { trySync, type Result } from '@epicenterhq/result';

const TIMESLICE_MS = 1000;

const TAGS = {
	INIT_MEDIA_RECORDER_FROM_STREAM_ERR:
		'InitMediaRecorderFromStreamErr' as const,
};

type MediaRecorderService = {
	startFromExistingStream: (
		{ bitsPerSecond }: { bitsPerSecond: number },
		callbacks?: {
			onStart?: () => void;
			onStop?: () => void;
			onPause?: () => void;
			onResume?: () => void;
		},
	) => void;
	startFromNewStream: (
		{ bitsPerSecond }: { bitsPerSecond: number },
		callbacks?: {
			onStart?: () => void;
			onStop?: () => void;
			onPause?: () => void;
			onResume?: () => void;
		},
	) => void;
	stopKeepStream: () => void;
	stopAndCloseStream: () => void;
};

export const MediaRecorderService = createMediaRecorderServiceWeb();

const OpenStreamDoesNotExistErr = () =>
	BubbleErr({
		_tag: 'OpenStreamDoesNotExistErr',
		title: 'Error initializing media recorder with preferred device',
		description: 'Trying to find another available audio input device...',
	} as const);

const OpenStreamIsInactiveErr = () =>
	BubbleErr({
		_tag: 'OpenStreamIsInactiveErr',
		title: 'Open stream is inactive',
		description: 'Refreshing recording session...',
	});

const createMediaRecorderServiceWeb = (() => {
	let recorder: MediaRecorder | null = null;
	const startRecording = (
		stream: MediaStream,
		{ bitsPerSecond }: { bitsPerSecond: number },
	) => {
		const newRecorderResult = trySyncBubble({
			try: () => new MediaRecorder(stream, { bitsPerSecond }),
			catch: (error) =>
				({
					_tag: TAGS.INIT_MEDIA_RECORDER_FROM_STREAM_ERR,
					message: 'Error initializing media recorder from stream',
				}) as const,
		});
		if (!newRecorderResult.ok) return newRecorderResult;
		const newRecorder = newRecorderResult.data;
		newRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
			if (!event.data.size) return;
			recordedChunks.push(event.data);
		});
		newRecorder.start(TIMESLICE_MS);
		recorder = newRecorder;
		return Ok(undefined);
	};

	const stopRecorder = async () => {
		const stopResult = await tryAsyncWhispering({
			try: () =>
				new Promise<Blob>((resolve, reject) => {
					if (!recorder) {
						reject(new Error('No active media recorder'));
						return;
					}
					recorder.addEventListener('stop', () => {
						if (!recorder) {
							reject(
								new Error('Media recorder was nullified during stop event'),
							);
							return;
						}
						const audioBlob = new Blob(recordedChunks, {
							type: recorder.mimeType,
						});
						resolve(audioBlob);
					});
					recorder.stop();
				}),
			catch: (error) =>
				({
					_tag: 'WhisperingError',
					title: 'Error stopping media recorder',
					description: 'Please try again',

					action: {
						type: 'more-details',
						error,
					},
				}) as const,
		});
		if (!stopResult.ok) return stopResult;
		const blob = stopResult.data;
		return Ok(blob);
	};
	const recordedChunks: Blob[] = [];

	return {
		async startFromExistingStream({ bitsPerSecond }) {
			const getReusedStream = async () => {
				if (!mediaStream.stream) {
					return OpenStreamDoesNotExistErr();
				}
				if (!mediaStream.stream.active) {
					return OpenStreamIsInactiveErr();
				}
				return Ok(mediaStream.stream);
			};
			const reusedStreamResult = await getReusedStream();
			if (!reusedStreamResult.ok) return reusedStreamResult;
			const reusedStream = reusedStreamResult.data;
			const startRecordingResult = startRecording(reusedStream, {
				bitsPerSecond,
			});
			return startRecordingResult;
		},
		async startFromNewStream({ bitsPerSecond }, callbacks) {
			const getNewStream = () => mediaStream.refreshStream();
			const newStreamResult = await getNewStream();
			if (!newStreamResult.ok) return newStreamResult;
			const newStream = newStreamResult.data;
			const startRecordingResult = startRecording(newStream, { bitsPerSecond });
			return startRecordingResult;
		},
		async stopKeepStream() {
			const stopResult = await stopRecorder();
			return stopResult;
		},
		async stopAndCloseStream() {
			const stopResult = await stopRecorder();
			mediaStream.destroy();
			return stopResult;
		},
	};
}) satisfies () => MediaRecorderService;

const createMediaRecorderServiceNative = (() => {
	return {
		startFromExistingStream() {},
		startFromNewStream() {
			invoke('start');
		},
		stopKeepStream() {},
		stopAndCloseStream() {
			invoke('stop');
		},
	};
}) satisfies () => MediaRecorderService;

// startRecording:
// if browser: if stream is already there, create new recorder with same stream
// if native: if stream + recorder is already there, return it

// stopRecording:
// stop it and return the blob
// if enabled, destroy the stream and recorder
