import {
	Ok,
	type QueryFn,
	type Result,
	createServiceErrorFns,
} from '@epicenterhq/result';
import type { WhisperingErrProperties } from '@repo/shared';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { toast } from './ToastService';

const TIMESLICE_MS = 1000;

type MediaRecorderErrProperties = WhisperingErrProperties;

/** Sets status message to be displayed in the UI that is calling this service */
export type UpdateStatusMessageFn = (message: {
	message: string;
}) => void;

type MediaRecorderService = {
	enumerateRecordingDevices: QueryFn<
		void,
		Pick<MediaDeviceInfo, 'deviceId' | 'label'>[],
		MediaRecorderErrProperties
	>;
	initRecordingSession: (
		settings: RecordingSessionSettings,
		callbacks: { setStatusMessage: UpdateStatusMessageFn },
	) => Promise<Result<void, MediaRecorderErrProperties>>;
	closeRecordingSession: (
		_: undefined,
		callbacks: { setStatusMessage: UpdateStatusMessageFn },
	) => Promise<Result<void, MediaRecorderErrProperties>>;
	startRecording: (
		recordingId: string,
		callbacks: { setStatusMessage: UpdateStatusMessageFn },
	) => Promise<Result<void, MediaRecorderErrProperties>>;
	stopRecording: (
		_: undefined,
		callbacks: { setStatusMessage: UpdateStatusMessageFn },
	) => Promise<Result<Blob, MediaRecorderErrProperties>>;
	cancelRecording: (
		_: undefined,
		callbacks: { setStatusMessage: UpdateStatusMessageFn },
	) => Promise<Result<void, MediaRecorderErrProperties>>;
};

type RecordingSession = {
	settings: RecordingSessionSettings;
	stream: MediaStream;
	recorder: {
		mediaRecorder: MediaRecorder;
		recordedChunks: Blob[];
		recordingId: string;
	} | null;
};

type RecordingSessionSettings = {
	deviceId: string;
	bitsPerSecond: number;
};

const { Err, tryAsync } = createServiceErrorFns<MediaRecorderErrProperties>();

export const createMediaRecorderServiceWeb = (): MediaRecorderService => {
	let currentSession: RecordingSession | null = null;

	const acquireStream = async (
		settings: RecordingSessionSettings,
		{ setStatusMessage }: { setStatusMessage: UpdateStatusMessageFn },
	) => {
		if (!settings.deviceId) {
			setStatusMessage({
				message:
					'No device selected, defaulting to first available audio input device...',
			});
			const getFirstStreamResult = await getFirstAvailableStream();
			if (!getFirstStreamResult.ok) {
				return Err({
					_tag: 'WhisperingError',
					title: 'Error acquiring stream',
					description:
						'No device selected and no available audio input devices found',
					action: { type: 'more-details', error: getFirstStreamResult.error },
				});
			}
			const firstStream = getFirstStreamResult.data;
			return Ok(firstStream);
		}
		setStatusMessage({
			message:
				'Please allow access to your microphone if prompted, connecting to selected audio input device...',
		});
		const getPreferredStreamResult = await getStreamForDeviceId(
			settings.deviceId,
		);
		if (!getPreferredStreamResult.ok) {
			setStatusMessage({
				message:
					'Error connecting to selected audio input device, trying to find another available audio input device...',
			});
			const getFirstStreamResult = await getFirstAvailableStream();
			if (!getFirstStreamResult.ok) {
				return Err({
					_tag: 'WhisperingError',
					title: 'Error acquiring stream',
					description:
						'Unable to connect to your selected microphone or find any available audio input devices',
					action: { type: 'more-details', error: getFirstStreamResult.error },
				});
			}
			const firstStream = getFirstStreamResult.data;
			return Ok(firstStream);
		}
		const preferredStream = getPreferredStreamResult.data;
		return Ok(preferredStream);
	};

	return {
		async enumerateRecordingDevices() {
			return tryAsync({
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
			});
		},
		async initRecordingSession(settings, { setStatusMessage }) {
			if (currentSession) {
				return Err({
					_tag: 'WhisperingError',
					title: '⚠️ Session Already Active',
					description: 'A recording session is already running and ready to go',
					action: { type: 'none' },
				});
			}
			const acquireStreamResult = await acquireStream(settings, {
				setStatusMessage,
			});
			if (!acquireStreamResult.ok) {
				return Err({
					_tag: 'WhisperingError',
					title: '🎤 Microphone Access Error',
					description: 'Unable to connect to your selected microphone',
					action: { type: 'more-details', error: acquireStreamResult.error },
				});
			}
			const stream = acquireStreamResult.data;
			currentSession = { settings, stream, recorder: null };
			return Ok(undefined);
		},
		async closeRecordingSession(_, { setStatusMessage }) {
			if (!currentSession) {
				return Err({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to close at the moment",
					action: { type: 'none' },
				});
			}
			if (currentSession.recorder) {
				return Err({
					_tag: 'WhisperingError',
					title: '⏺️ Recording in Progress',
					description:
						'Please stop or cancel your current recording first before closing the session',
					action: {
						type: 'none',
					},
				});
			}
			setStatusMessage({ message: 'Stopping media stream...' });
			for (const track of currentSession.stream.getTracks()) {
				track.stop();
			}
			setStatusMessage({ message: 'Closing media recorder...' });
			currentSession.recorder = null;
			setStatusMessage({ message: 'Closing recording session...' });
			currentSession = null;
			return Ok(undefined);
		},
		async startRecording(recordingId, { setStatusMessage }) {
			if (!currentSession) {
				return Err({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description:
						"There's no recording session to start recording in at the moment",
					action: { type: 'none' },
				});
			}
			const { stream, settings } = currentSession;
			if (!stream.active) {
				setStatusMessage({
					message:
						'🔄 Recording Session Expired, refreshing to get you back on track...',
				});
				const acquireStreamResult = await acquireStream(settings, {
					setStatusMessage,
				});
				if (!acquireStreamResult.ok) {
					return Err({
						_tag: 'WhisperingError',
						title: '🎤 Microphone Access Error',
						description: 'Unable to connect to your selected microphone',
						action: { type: 'more-details', error: acquireStreamResult.error },
					});
				}
				const stream = acquireStreamResult.data;
				currentSession = { settings, stream, recorder: null };
				return Ok(undefined);
			}
			setStatusMessage({ message: 'Starting recording...' });
			const newRecorderResult = await tryAsync({
				try: async () =>
					new MediaRecorder(stream, { bitsPerSecond: settings.bitsPerSecond }),
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: '🎙️ Recording Setup Failed',
					description: 'Unable to initialize your microphone. Please try again',
					action: { type: 'more-details', error },
				}),
			});
			if (!newRecorderResult.ok) return Err(newRecorderResult.error);
			const newRecorder = newRecorderResult.data;
			setStatusMessage({ message: 'Recording started...' });
			currentSession.recorder = {
				mediaRecorder: newRecorder,
				recordedChunks: [],
				recordingId,
			};
			newRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
				if (!currentSession || !event.data.size) return;
				currentSession.recorder?.recordedChunks.push(event.data);
			});
			newRecorder.start(TIMESLICE_MS);
			return Ok(undefined);
		},
		async stopRecording(_, { setStatusMessage }) {
			if (!currentSession?.recorder?.mediaRecorder) {
				return Err({
					_tag: 'WhisperingError',
					title: '⚠️ Nothing to Stop',
					description: 'No active recording found to stop',
					action: { type: 'none' },
				});
			}
			setStatusMessage({ message: 'Stopping recording...' });
			const stopResult = await tryAsync({
				try: () =>
					new Promise<Blob>((resolve, reject) => {
						if (!currentSession?.recorder?.mediaRecorder) {
							reject(new Error('No active media recorder'));
							return;
						}
						currentSession.recorder.mediaRecorder.addEventListener(
							'stop',
							() => {
								if (!currentSession?.recorder?.mediaRecorder) {
									reject(
										new Error(
											'Media recorder was nullified before stop event listener',
										),
									);
									return;
								}
								const audioBlob = new Blob(
									currentSession.recorder.recordedChunks,
									{
										type: currentSession.recorder.mediaRecorder.mimeType,
									},
								);
								resolve(audioBlob);
							},
						);
						currentSession.recorder.mediaRecorder.stop();
						setStatusMessage({ message: 'Recording stopped...' });
					}),
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: '⏹️ Recording Stop Failed',
					description: 'Unable to save your recording. Please try again',
					action: { type: 'more-details', error },
				}),
			});
			if (!stopResult.ok) return Err(stopResult.error);
			const blob = stopResult.data;
			return Ok(blob);
		},
		async cancelRecording(_, { setStatusMessage }) {
			if (!currentSession?.recorder?.mediaRecorder) {
				return Err({
					_tag: 'WhisperingError',
					title: '⚠️ Nothing to Cancel',
					description: 'No active recording found to cancel',
					action: { type: 'none' },
				});
			}
			setStatusMessage({ message: 'Stopping media stream...' });
			for (const track of currentSession.stream.getTracks()) {
				track.stop();
			}
			setStatusMessage({ message: 'Stopping media recorder...' });
			currentSession.recorder.mediaRecorder.stop();
			setStatusMessage({ message: 'Cancelling recording...' });
			currentSession.recorder = null;
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
				return Err({
					_tag: 'WhisperingError',
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
		initRecordingSession: async (
			settings,
			{ setStatusMessage: sendUpdateStatus },
		) => {
			sendUpdateStatus({
				message: 'Initializing recording session...',
				description: 'Please allow access to your microphone if prompted.',
			});
			const result = await invoke('init_recording_session');
			if (!result.ok) return Err(result.error);
			return Ok(undefined);
		},
		closeRecordingSession: async (
			_,
			{ setStatusMessage: sendUpdateStatus },
		) => {
			sendUpdateStatus({
				message: 'Closing recording session...',
				description: 'Please allow access to your microphone if prompted.',
			});
			const result = await invoke('close_recording_session');
			if (!result.ok) return Err(result.error);
			return Ok(undefined);
		},
		startRecording: async (
			recordingId,
			{ setStatusMessage: sendUpdateStatus },
		) => {
			sendUpdateStatus({
				message: 'Starting recording...',
				description: 'Please allow access to your microphone if prompted.',
			});
			const result = await invoke('start_recording');
			if (!result.ok) return Err(result.error);
			return Ok(undefined);
		},
		stopRecording: async (_, { setStatusMessage: sendUpdateStatus }) => {
			sendUpdateStatus({
				message: 'Stopping recording...',
				description: 'Please allow access to your microphone if prompted.',
			});
			const result = await invoke<Blob>('stop_recording');
			if (!result.ok) return Err(result.error);
			return Ok(result.data);
		},
		cancelRecording: async (_, { setStatusMessage: sendUpdateStatus }) => {
			sendUpdateStatus({
				message: 'Cancelling recording...',
				description: 'Please allow access to your microphone if prompted.',
			});
			const result = await invoke('cancel_recording');
			if (!result.ok) return Err(result.error);
			return Ok(undefined);
		},
	};
};

async function invoke<T>(
	command: string,
): Promise<Result<T, MediaRecorderErrProperties>> {
	return tryAsync({
		try: async () => await tauriInvoke<T>(command),
		catch: (error) => ({
			_tag: 'WhisperingError',
			title: 'Command Execution Failed',
			description: `Error invoking command ${command}`,
			action: { type: 'more-details', error },
		}),
	});
}

async function getFirstAvailableStream() {
	const recordingDevicesResult = await tryAsync({
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
			title:
				'Error enumerating recording devices and acquiring first available stream',
			description:
				'Please make sure you have given permission to access your audio devices',
			action: { type: 'more-details', error },
		}),
	});
	if (!recordingDevicesResult.ok) return recordingDevicesResult;
	const recordingDevices = recordingDevicesResult.data;

	for (const device of recordingDevices) {
		const streamResult = await getStreamForDeviceId(device.deviceId);
		if (streamResult.ok) {
			return streamResult;
		}
	}
	return Err({
		_tag: 'WhisperingError',
		title: '🎤 Microphone Access Error',
		description: 'Unable to connect to your selected microphone',
		action: {
			type: 'more-details',
			error: new Error('No available audio input devices'),
		},
	});
}

async function getStreamForDeviceId(recordingDeviceId: string) {
	return tryAsync({
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
			_tag: 'WhisperingError',
			title: '🎤 Microphone Access Error',
			description: 'Unable to connect to your selected microphone',
			action: { type: 'more-details', error },
		}),
	});
}
