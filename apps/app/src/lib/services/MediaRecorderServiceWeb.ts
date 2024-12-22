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
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { nanoid } from 'nanoid/non-secure';
import { toast } from './ToastService.js';
import type { Result } from '@epicenterhq/result';

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

type RecordingSessionSettings = {
	deviceId: string;
	bitsPerSecond: number;
};
type RecordingSession = {
	settings: RecordingSessionSettings;
	stream: MediaStream;
	recorder: MediaRecorder | null;
	recordedChunks: Blob[];
};

type MediaRecorderService = {
	readonly isInRecordingSession: boolean;
	enumerateRecordingDevices: () => Promise<
		WhisperingResult<Pick<MediaDeviceInfo, 'deviceId' | 'label'>[]>
	>;
	initRecordingSession: (
		settings: RecordingSessionSettings,
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
		get isInRecordingSession() {
			return currentSession !== null;
		},
		enumerateRecordingDevices: async () =>
			tryAsyncWhispering({
				try: async () => {
					const allAudioDevicesStream =
						await navigator.mediaDevices.getUserMedia({
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
					action: { type: 'more-details', error },
				}),
			}),
		async initRecordingSession(settings) {
			const getStreamForDeviceIdResult = await getStreamForDeviceId(
				settings.deviceId,
			);
			if (!getStreamForDeviceIdResult.ok) return getStreamForDeviceIdResult;
			const stream = getStreamForDeviceIdResult.data;
			currentSession = {
				settings,
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
			const {
				stream,
				settings: { bitsPerSecond },
			} = currentSession;
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
				if (!currentSession || !event.data.size) return;
				currentSession.recordedChunks.push(event.data);
			});
			newRecorder.start(TIMESLICE_MS);
			currentSession.recorder = newRecorder;
			return Ok(undefined);
		},
		async stopRecording() {
			const stopResult = await tryAsyncBubble({
				try: () =>
					new Promise<Blob>((resolve, reject) => {
						if (!currentSession?.recorder) {
							reject(new Error('No active media recorder'));
							return;
						}
						currentSession.recorder.addEventListener('stop', () => {
							if (!currentSession?.recorder) {
								reject(
									new Error(
										'Media recorder was nullified before stop event listener',
									),
								);
								return;
							}
							const audioBlob = new Blob(currentSession.recordedChunks, {
								type: currentSession.recorder.mimeType,
							});
							resolve(audioBlob);
						});
						currentSession.recorder.stop();
					}),
				catch: (error) =>
					({
						_tag: 'StopMediaRecorderErr',

						message:
							error instanceof Error
								? `Error stopping media recorder: ${error.message}`
								: 'Error stopping media recorder',
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
			currentSession.recordedChunks = [];
			return Ok(undefined);
		},
	};
};

const createMediaRecorderServiceNative = (): MediaRecorderService => {
	return {
		enumerateRecordingDevices: async () => {
			const invokeResult = await invoke<string[]>(
				'enumerate_recording_devices',
			);
			if (!invokeResult.ok) {
				return WhisperingErr({
					title: 'Error enumerating recording devices',
					description:
						'Please make sure you have given permission to access your audio devices',
					action: { type: 'more-details', error: invokeResult.error },
				});
			}
			const deviceNames = invokeResult.data;
			return Ok(
				deviceNames.map((deviceName) => ({
					deviceId: deviceName,
					label: deviceName,
				})),
			);
		},
		initRecordingSession: async () => invoke('init_recording_session'),
		closeRecordingSession: async () => invoke('close_recording_session'),
		startRecording: async () => invoke('start_recording'),
		stopRecording: async () => invoke('stop_recording'),
		cancelRecording: async () => invoke('cancel_recording'),
	};
};

async function invoke<T>(command: string): Promise<BubbleResult<T>> {
	return tryAsyncBubble({
		try: async () => await tauriInvoke<T>(command),
		catch: (error) => ({
			_tag: 'InnerInvokeErr',
			message: `Error invoking command ${command}: ${error.message}`,
		}),
	});
}

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
}
toast.info({
	id: toastId,
	title: 'Defaulted to first available audio input device',
	description: 'You can select a specific device in the settings.',
});
toast.success({
	id: toastId,
	title: 'Connected to selected audio input device',
	description: 'Successfully connected to your microphone stream.',
});
toast.loading({
	id: toastId,
	title: 'Error connecting to selected audio input device',
	description: 'Trying to find another available audio input device...',
});
toast.info({
	id: toastId,
	title: 'Defaulted to first available audio input device',
	description: 'You can select a specific device in the settings.',
});
toast.loading({
	title: 'Existing recording session not found',
	description: 'Creating a new recording session...',
});
toast.error({
	title: 'Error creating new recording session',
	description: 'Please try again',
});
toast.loading({
	title: 'Recording session created',
	description: 'Recording in progress...',
});
toast.loading({
	title: 'Existing recording session is inactive',
	description: 'Refreshing recording session...',
});
toast.loading({
	title: 'Error initializing media recorder with preferred device',
	description: 'Trying to find another available audio input device...',
});

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
	const recordingDevicesResult = await (async () => {
		return tryAsyncWhispering({
			try: async () => {
				const allAudioDevicesStream = await navigator.mediaDevices.getUserMedia(
					{
						audio: true,
					},
				);
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
	})();
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
