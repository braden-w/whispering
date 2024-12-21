import { settings } from '$lib/stores/settings.svelte.js';
import {
	Ok,
	WhisperingErr,
	type WhisperingResult,
	tryAsyncBubble,
	tryAsyncWhispering,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import { toast } from './ToastService.js';
import {
	BubbleErr,
	Ok,
	tryAsyncWhispering,
	trySyncBubble,
	type OnlyErrors,
} from '@repo/shared';
import { invoke } from '@tauri-apps/api/core';
import { mediaStream } from './mediaStream.svelte';

const TIMESLICE_MS = 1000;

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

export const createMediaRecorderServiceWeb = () => {
	let recorder: MediaRecorder | null = null;
	let isInRecordingSession = $state<boolean>(false);
	const recordedChunks: Blob[] = [];

	const mediaStream = createMediaStreamManager({
		onSetStream: (stream) => {
			isInRecordingSession = stream?.active ?? false;
		},
	});

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
			onError: (
				errResult: OnlyErrors<Awaited<ReturnType<typeof stopRecorder>>>,
			) => void;
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
			onError: (
				errResult: OnlyErrors<Awaited<ReturnType<typeof stopRecorder>>>,
			) => void;
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

const createMediaRecorderServiceNative = () => {
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
};

// startRecording:
// if browser: if stream is already there, create new recorder with same stream
// if native: if stream + recorder is already there, return it

// stopRecording:
// stop it and return the blob
// if enabled, destroy the stream and recorder

function createMediaStreamManager({
	onSetStream,
}: { onSetStream: (stream: MediaStream | null) => void }) {
	let currentStream: MediaStream | null = null;
	const setStream = (stream: MediaStream | null) => {
		currentStream = stream;
		onSetStream(stream);
	};

	return {
		get stream() {
			return currentStream;
		},
		async refreshStream(): Promise<WhisperingResult<MediaStream>> {
			this.destroy();
			const toastId = nanoid();
			toast.loading({
				id: toastId,
				title: 'Connecting to selected audio input device...',
				description: 'Please allow access to your microphone if prompted.',
			});
			if (!settings.value.selectedAudioInputDeviceId) {
				toast.loading({
					id: toastId,
					title: 'No device selected',
					description: 'Defaulting to first available audio input device...',
				});
				const firstAvailableStreamResult = await getFirstAvailableStream();
				if (!firstAvailableStreamResult.ok) return firstAvailableStreamResult;
				const firstAvailableStream = firstAvailableStreamResult.data;
				setStream(firstAvailableStream);
				toast.info({
					id: toastId,
					title: 'Defaulted to first available audio input device',
					description: 'You can select a specific device in the settings.',
				});
				return Ok(firstAvailableStream);
			}
			const maybeStream = await getStreamForDeviceId(
				settings.value.selectedAudioInputDeviceId,
			);
			if (maybeStream !== null) {
				setStream(maybeStream);
				toast.success({
					id: toastId,
					title: 'Connected to selected audio input device',
					description: 'Successfully connected to your microphone stream.',
				});
				return Ok(maybeStream);
			}
			toast.loading({
				id: toastId,
				title: 'Error connecting to selected audio input device',
				description: 'Trying to find another available audio input device...',
			});
			const firstAvailableStreamResult = await getFirstAvailableStream();
			if (!firstAvailableStreamResult.ok) {
				toast.dismiss(toastId);
				return firstAvailableStreamResult;
			}
			const firstAvailableStream = firstAvailableStreamResult.data;
			setStream(firstAvailableStream);
			toast.info({
				id: toastId,
				title: 'Defaulted to first available audio input device',
				description: 'You can select a specific device in the settings.',
			});
			return Ok(firstAvailableStream);
		},
		destroy() {
			if (currentStream === null) return;
			for (const track of currentStream.getTracks()) {
				track.stop();
			}
			setStream(null);
		},
	} as const;
}

export function enumerateRecordingDevices(): Promise<
	WhisperingResult<MediaDeviceInfo[]>
> {
	return tryAsyncWhispering({
		try: async () => {
			const allAudioDevicesStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			const devices = await navigator.mediaDevices.enumerateDevices();
			for (const track of allAudioDevicesStream.getTracks()) {
				track.stop();
			}
			const audioInputDevices = devices.filter(
				(device) => device.kind === 'audioinput',
			);
			return audioInputDevices;
		},
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Error enumerating recording devices',
			description:
				'Please make sure you have given permission to access your audio devices',
			action: {
				type: 'more-details',
				error,
			},
		}),
	});
}

async function getFirstAvailableStream(): Promise<
	WhisperingResult<MediaStream>
> {
	const recordingDevicesResult = await enumerateRecordingDevices();
	if (!recordingDevicesResult.ok) return recordingDevicesResult;
	const recordingDevices = recordingDevicesResult.data;

	for (const device of recordingDevices) {
		const maybeStream = await getStreamForDeviceId(device.deviceId);
		if (maybeStream) {
			settings.value.selectedAudioInputDeviceId = device.deviceId;
			mediaStream.refreshStream();
			return Ok(maybeStream);
		}
	}
	return WhisperingErr({
		title: 'No available audio input devices',
		description: 'Please make sure you have a microphone connected',
		action: {
			type: 'link',
			label: 'Open Settings',
			goto: '/settings',
		},
	});
}

async function getStreamForDeviceId(
	recordingDeviceId: string,
): Promise<MediaStream | null> {
	const result = await tryAsyncBubble({
		try: async () => {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					deviceId: { exact: recordingDeviceId },
					channelCount: 1, // Mono audio is usually sufficient for voice recording
					sampleRate: 16000, // 16 kHz is a good balance for voice
				},
			});
			return stream;
		},
		catch: (error) => ({
			_tag: 'GetStreamError',
			message:
				error instanceof Error ? error.message : 'Please try again later.',
		}),
	});
	if (result.ok) return result.data;
	return null;
}
