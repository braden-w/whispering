import { settings } from '$lib/stores/settings.svelte.js';
import {
	BubbleErr,
	type BubbleResult,
	Ok,
	type OnlyErrors,
	WhisperingErr,
	type WhisperingResult,
	tryAsyncBubble,
	tryAsyncWhispering,
	trySyncBubble,
} from '@repo/shared';
import { invoke } from '@tauri-apps/api/core';
import { nanoid } from 'nanoid/non-secure';
import { toast } from './ToastService.js';

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

type UserRecordingSessionConfig = {
	deviceId: string;
	bitsPerSecond: number;
};
type RecordingSession = UserRecordingSessionConfig & {
	stream: MediaStream;
	recorder: MediaRecorder | null;
	recordedChunks: Blob[];
};

type MediaRecorderService = {
	enumerateRecordingDevices: () => Promise<BubbleResult<MediaDeviceInfo[]>>;
	initRecordingSession: (
		userRecordingSessionConfig: UserRecordingSessionConfig,
	) => Promise<BubbleResult<void>>;
	closeRecordingSession: () => Promise<BubbleResult<void>>;
	startRecording: (opts: { recordingId: string }) => Promise<
		BubbleResult<void>
	>;
	stopRecording: () => Promise<BubbleResult<Blob>>;
	cancelRecording: () => Promise<BubbleResult<void>>;
};

export const createMediaRecorderServiceWeb = (): MediaRecorderService => {
	let currentSession: RecordingSession | null = null;

	return {
		enumerateRecordingDevices,
		async initRecordingSession(config) {
			const getStreamForDeviceIdResult = await getStreamForDeviceId(
				config.deviceId,
			);
			if (!getStreamForDeviceIdResult.ok) return getStreamForDeviceIdResult;
			const stream = getStreamForDeviceIdResult.data;
			currentSession = {
				...config,
				stream,
				recorder: null,
				recordedChunks: [],
			};
			return Ok(undefined);
		},
		async closeRecordingSession() {
			if (!currentSession) {
				return BubbleErr({
					_tag: 'RecordingSessionNotInitializedErr',
					message: 'Attempted to close recording session without initializing',
				} as const);
			}
			if (currentSession.recorder) {
				return BubbleErr({
					_tag: 'RecordingSessionNotInitializedErr',
					message:
						'Attempted to close recording session without stopping or canceling',
				} as const);
			}
			for (const track of currentSession.stream.getTracks()) {
				track.stop();
			}
			currentSession.recorder = null;
			currentSession.recordedChunks = [];
			currentSession = null;
			return Ok(undefined);
		},
		async startRecording({ recordingId }) {
			if (!currentSession) {
				return BubbleErr({
					_tag: 'RecordingSessionNotInitializedErr',
					message: 'Recording session not initialized',
				});
			}
			const { stream, bitsPerSecond } = currentSession;
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
		},
		async stopRecording() {
			const stopResult = await tryAsyncBubble({
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
						_tag: 'StopMediaRecorderErr',
						message: 'Error stopping media recorder',
					}) as const,
			});
			if (!stopResult.ok) return stopResult;
			const blob = stopResult.data;
			return Ok(blob);
		},
		async cancelRecording() {
			if (!currentSession?.recorder)
				return BubbleErr({
					_tag: 'CancelRecordingErr',
					message: 'No active media recorder',
				} as const);
			currentSession.recorder.stop();
			currentSession.recorder = null;
			return Ok(undefined);
		},
	};
};

const createMediaRecorderServiceNative = () => {
	return {
		startFromExistingRecordingSession() {},
		startFromNewRecordingSession() {
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

function createMediaStreamManager() {
	const setStream = (stream: MediaStream | null) => {
		currentStream = stream;
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
				const firstAvailableStreamResult = await getFirstAvailableStream({
					onSuccess: (stream, deviceId) => {
						settings.value.selectedAudioInputDeviceId = deviceId;
						setStream(stream);
					},
					onError: () => {
						toast.dismiss(toastId);
					},
				});
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
			const firstAvailableStreamResult = await getFirstAvailableStream({
				onSuccess: (stream, deviceId) => {
					settings.value.selectedAudioInputDeviceId = deviceId;
					setStream(stream);
				},
				onError: () => {
					toast.dismiss(toastId);
				},
			});
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

async function enumerateRecordingDevices() {
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

const NoAvailableAudioInputDevicesErr = WhisperingErr({
	title: 'No available audio input devices',
	description: 'Please make sure you have a microphone connected',
	action: {
		type: 'link',
		label: 'Open Settings',
		goto: '/settings',
	},
} as const);

async function getFirstAvailableStream({
	onSuccess,
	onError,
}: {
	onSuccess: (stream: MediaStream, deviceId: string) => void;
	onError: (error: typeof NoAvailableAudioInputDevicesErr) => void;
}) {
	const recordingDevicesResult = await enumerateRecordingDevices();
	if (!recordingDevicesResult.ok) return recordingDevicesResult;
	const recordingDevices = recordingDevicesResult.data;

	for (const device of recordingDevices) {
		const streamResult = await getStreamForDeviceId(device.deviceId);
		if (streamResult.ok) {
			onSuccess(streamResult.data, device.deviceId);
			return streamResult;
		}
	}
	onError(NoAvailableAudioInputDevicesErr);
}

async function getStreamForDeviceId(recordingDeviceId: string) {
	return tryAsyncBubble({
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
			_tag: 'GetStreamForDeviceIdErr',
			message: `Error getting stream for device id ${recordingDeviceId}: ${error.message}`,
		}),
	});
}
