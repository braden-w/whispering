import {
	BubbleErr,
	Err,
	Ok,
	tryAsyncBubble,
	tryAsyncWhispering,
	trySyncBubble,
	WhisperingErr,
	type OnlyErrors,
} from '@repo/shared';
import { mediaStream } from './mediaStream.svelte';
import { toast } from 'svelte-sonner';
import { invoke } from '@tauri-apps/api/core';
import { trySync, type Result } from '@epicenterhq/result';

const TIMESLICE_MS = 1000;

export const MediaRecorderService = createMediaRecorderServiceWeb();

const OpenStreamDoesNotExistErr = BubbleErr({
	_tag: 'OpenStreamDoesNotExistErr',
	message: 'Error initializing media recorder with preferred device',
	// title: 'Error initializing media recorder with preferred device',
	// description: 'Trying to find another available audio input device...',
} as const);
type OpenStreamDoesNotExistErr = typeof OpenStreamDoesNotExistErr;

const OpenStreamIsInactiveErr = BubbleErr({
	_tag: 'OpenStreamIsInactiveErr',
	message: 'Open stream is inactive',
	// title: 'Open stream is inactive',
	// description: 'Refreshing recording session...',
} as const);
type OpenStreamIsInactiveErr = typeof OpenStreamIsInactiveErr;

const createMediaRecorderServiceWeb = () => {
	let recorder: MediaRecorder | null = null;
	const recordedChunks: Blob[] = [];

	const startRecording = (
		stream: MediaStream,
		{ bitsPerSecond }: { bitsPerSecond: number },
	) => {
		const newRecorderResult = trySyncBubble({
			try: () => new MediaRecorder(stream, { bitsPerSecond }),
			catch: (error) =>
				({
					_tag: 'InitMediaRecorderFromStreamErr',
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

	const cancelRecording = () => {
		if (!recorder) return OpenStreamDoesNotExistErr;
		recorder.stop();
		recorder = null;
		return Ok(undefined);
	};

	const getReusedStream = async () => {
		if (!mediaStream.stream) {
			return OpenStreamDoesNotExistErr;
		}
		if (!mediaStream.stream.active) {
			return OpenStreamIsInactiveErr;
		}
		return Ok(mediaStream.stream);
	};

	return {
		async startFromExistingStream(
			{ bitsPerSecond }: { bitsPerSecond: number },
			{
				onSuccess,
				onError,
			}: {
				onSuccess: () => void;
				onError: (
					errResult: OnlyErrors<
						| Awaited<ReturnType<typeof getReusedStream>>
						| Awaited<ReturnType<typeof startRecording>>
					>,
				) => void;
			},
		) {
			const reusedStreamResult = await getReusedStream();
			if (!reusedStreamResult.ok) {
				onError(reusedStreamResult);
				return;
			}
			const reusedStream = reusedStreamResult.data;
			const startRecordingResult = startRecording(reusedStream, {
				bitsPerSecond,
			});
			if (!startRecordingResult.ok) {
				onError(startRecordingResult);
				return;
			}
			onSuccess();
		},
		async startFromNewStream({ bitsPerSecond }: { bitsPerSecond: number }) {
			const getNewStream = () => mediaStream.refreshStream();
			const newStreamResult = await getNewStream();
			if (!newStreamResult.ok) return newStreamResult;
			const newStream = newStreamResult.data;
			const startRecordingResult = startRecording(newStream, { bitsPerSecond });
			return startRecordingResult;
		},
		async stopKeepStream({
			onSuccess,
			onError,
		}: {
			onSuccess: (blob: Blob) => void;
			onError: (error: Awaited<ReturnType<typeof stopRecorder>>) => void;
		}) {
			const stopResult = await stopRecorder();
			if (!stopResult.ok) {
				onError(stopResult);
				return stopResult;
			}
			const blob = stopResult.data;
			onSuccess(blob);
		},
		async stopAndCloseStream({
			onSuccess,
			onError,
		}: {
			onSuccess: (blob: Blob) => void;
			onError: (error: Awaited<ReturnType<typeof stopRecorder>>) => void;
		}) {
			const stopResult = await stopRecorder();
			if (!stopResult.ok) {
				onError(stopResult);
				return stopResult;
			}
			const blob = stopResult.data;
			mediaStream.destroy();
			onSuccess(blob);
		},
		async cancelKeepStream() {
			const cancelResult = cancelRecording();
			return cancelResult;
		},
		async cancelAndCloseStream() {
			const cancelResult = cancelRecording();
			mediaStream.destroy();
			return cancelResult;
		},
	};
};

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
