import {
	Ok,
	type ServiceFn,
	type Result,
	createServiceErrorFns,
} from '@epicenterhq/result';
import type { ToastOptions, WhisperingErrProperties } from '@repo/shared';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { toast } from './ToastService';

const TIMESLICE_MS = 1000;

type MediaRecorderErrProperties = {
	_tag: 'MediaRecorderError';
	title: string;
	description: string;
	error: unknown | undefined;
};

export type UpdateStatusMessageFn = (args: {
	title: string;
	description: string;
}) => void;

type MediaRecorderService = {
	enumerateRecordingDevices: ServiceFn<
		void,
		Pick<MediaDeviceInfo, 'deviceId' | 'label'>[],
		MediaRecorderErrProperties
	>;
	initRecordingSession: (
		settings: RecordingSessionSettings,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<Result<void, MediaRecorderErrProperties>>;
	closeRecordingSession: (
		_: undefined,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<Result<void, MediaRecorderErrProperties>>;
	startRecording: (
		recordingId: string,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<Result<void, MediaRecorderErrProperties>>;
	stopRecording: (
		_: undefined,
		callbacks: { sendStatus: UpdateStatusMessageFn },
	) => Promise<Result<Blob, MediaRecorderErrProperties>>;
	cancelRecording: (
		_: undefined,
		callbacks: { sendStatus: UpdateStatusMessageFn },
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

const { Err: MediaRecorderServiceErr, tryAsync: tryAsyncMediaRecorderService } =
	createServiceErrorFns<MediaRecorderErrProperties>();

export const createMediaRecorderServiceWeb = (): MediaRecorderService => {
	let currentSession: RecordingSession | null = null;

	const acquireStream = async (
		settings: RecordingSessionSettings,
		{ sendStatus }: { sendStatus: UpdateStatusMessageFn },
	) => {
		if (!settings.deviceId) {
			sendStatus({
				title: '🔍 No Device Selected',
				description:
					"No worries! We'll find the best microphone for you automatically...",
			});
			const getFirstStreamResult = await getFirstAvailableStream();
			if (!getFirstStreamResult.ok) {
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '🚫 Stream Error',
					description:
						"Hmm... We couldn't find any microphones to use. Check your connections and try again!",
					error: getFirstStreamResult.error,
				});
			}
			const firstStream = getFirstStreamResult.data;
			return Ok(firstStream);
		}
		sendStatus({
			title: '🎯 Connecting Device',
			description:
				'Almost there! Just need your permission to use the microphone...',
		});
		const getPreferredStreamResult = await getStreamForDeviceId(
			settings.deviceId,
		);
		if (!getPreferredStreamResult.ok) {
			sendStatus({
				title: '⚠️ Connection Failed',
				description:
					"That microphone isn't working. Let's try finding another one...",
			});
			const getFirstStreamResult = await getFirstAvailableStream();
			if (!getFirstStreamResult.ok) {
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '🎤 No Microphone Found',
					description:
						"We couldn't connect to any microphones. Make sure they're plugged in and try again!",
					error: getFirstStreamResult.error,
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
			return tryAsyncMediaRecorderService({
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
					_tag: 'MediaRecorderError',
					title: '🎤 Device Access Error',
					description:
						'Oops! We need permission to see your microphones. Check your browser settings and try again!',
					error,
				}),
			});
		},
		async initRecordingSession(settings, { sendStatus }) {
			if (currentSession) {
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '🚫 No Active Session',
					description:
						'Looks like we need to start a new recording session first!',
					error: undefined,
				});
			}
			const acquireStreamResult = await acquireStream(settings, {
				sendStatus,
			});
			if (!acquireStreamResult.ok) {
				return acquireStreamResult;
			}
			const stream = acquireStreamResult.data;
			currentSession = { settings, stream, recorder: null };
			return Ok(undefined);
		},
		async closeRecordingSession(_, { sendStatus }) {
			if (!currentSession) {
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '❌ No Active Session',
					description: "There's no recording session to close at the moment",
					error: undefined,
				});
			}
			sendStatus({
				title: '🎙️ Cleaning Up',
				description:
					'Safely stopping your audio stream to free up system resources...',
			});
			for (const track of currentSession.stream.getTracks()) {
				track.stop();
			}
			sendStatus({
				title: '🧹 Almost Done',
				description:
					'Cleaning up recording resources and preparing for next session...',
			});
			currentSession.recorder = null;
			sendStatus({
				title: '✨ All Set',
				description:
					'Recording session successfully closed and resources freed',
			});
			currentSession = null;
			return Ok(undefined);
		},
		async startRecording(recordingId, { sendStatus }) {
			if (!currentSession) {
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '🚫 No Active Session',
					description:
						'Looks like we need to start a new recording session first!',
					error: undefined,
				});
			}
			const { stream, settings } = currentSession;
			if (!stream.active) {
				sendStatus({
					title: '🔄 Session Expired',
					description:
						'Your recording session timed out. Reconnecting to your microphone...',
				});
				const acquireStreamResult = await acquireStream(settings, {
					sendStatus,
				});
				if (!acquireStreamResult.ok) {
					return acquireStreamResult;
				}
				const stream = acquireStreamResult.data;
				currentSession = { settings, stream, recorder: null };
				return Ok(undefined);
			}
			sendStatus({
				title: '🎯 Getting Ready',
				description: 'Initializing your microphone and preparing to record...',
			});
			const newRecorderResult = await tryAsyncMediaRecorderService({
				try: async () =>
					new MediaRecorder(stream, { bitsPerSecond: settings.bitsPerSecond }),
				catch: (error) => ({
					_tag: 'MediaRecorderError',
					title: '🎙️ Setup Failed',
					description:
						"Oops! Something went wrong with your microphone. Let's try that again!",
					error,
				}),
			});
			if (!newRecorderResult.ok)
				return MediaRecorderServiceErr(newRecorderResult.error);
			const newRecorder = newRecorderResult.data;
			sendStatus({
				title: '🎤 Recording Active',
				description:
					'Your microphone is now recording. Speak clearly and naturally!',
			});
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
		async stopRecording(_, { sendStatus }) {
			if (!currentSession?.recorder?.mediaRecorder) {
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '⚠️ Nothing to Stop',
					description: 'No active recording found to stop',
					error: undefined,
				});
			}
			sendStatus({
				title: '⏸️ Finishing Up',
				description:
					'Saving your recording and preparing the final audio file...',
			});
			const stopResult = await tryAsyncMediaRecorderService({
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
						sendStatus({
							title: '✅ Recording Complete',
							description: 'Successfully saved your audio recording!',
						});
					}),
				catch: (error) => ({
					_tag: 'MediaRecorderError',
					title: '⏹️ Recording Stop Failed',
					description: 'Unable to save your recording. Please try again',
					error,
				}),
			});
			if (!stopResult.ok) return MediaRecorderServiceErr(stopResult.error);
			const blob = stopResult.data;
			return Ok(blob);
		},
		async cancelRecording(_, { sendStatus }) {
			if (!currentSession?.recorder?.mediaRecorder) {
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '⚠️ Nothing to Cancel',
					description: 'No active recording found to cancel',
					error: undefined,
				});
			}
			sendStatus({
				title: '🛑 Cancelling',
				description:
					'Safely stopping your recording and cleaning up resources...',
			});
			for (const track of currentSession.stream.getTracks()) {
				track.stop();
			}
			sendStatus({
				title: '🧹 Almost Done',
				description: 'Closing recording session and freeing up resources...',
			});
			currentSession.recorder.mediaRecorder.stop();
			sendStatus({
				title: '✨ Cancelled',
				description:
					'Recording successfully cancelled and all resources cleaned up',
			});
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
				return MediaRecorderServiceErr({
					_tag: 'MediaRecorderError',
					title: '🎤 Device Access Error',
					description:
						'Oops! We need permission to see your microphones. Check your browser settings and try again!',
					error: invokeResult.error,
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
			{ sendStatus: sendUpdateStatus },
		) => {
			sendUpdateStatus({
				title: '🎤 Setting Up',
				description:
					'Initializing your recording session and checking microphone access...',
			});
			const result = await invoke('init_recording_session');
			if (!result.ok) return MediaRecorderServiceErr(result.error);
			return Ok(undefined);
		},
		closeRecordingSession: async (_, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🔄 Closing Session',
				description:
					'Safely closing your recording session and freeing up resources...',
			});
			const result = await invoke('close_recording_session');
			if (!result.ok) return MediaRecorderServiceErr(result.error);
			return Ok(undefined);
		},
		startRecording: async (recordingId, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🎯 Starting Up',
				description: 'Preparing your microphone and initializing recording...',
			});
			const result = await invoke('start_recording');
			if (!result.ok) return MediaRecorderServiceErr(result.error);
			return Ok(undefined);
		},
		stopRecording: async (_, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '⏸️ Finishing Up',
				description:
					'Saving your recording and preparing the final audio file...',
			});
			const result = await invoke<Blob>('stop_recording');
			if (!result.ok) return MediaRecorderServiceErr(result.error);
			return Ok(result.data);
		},
		cancelRecording: async (_, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🛑 Cancelling',
				description:
					'Safely stopping your recording and cleaning up resources...',
			});
			const result = await invoke('cancel_recording');
			if (!result.ok) return MediaRecorderServiceErr(result.error);
			return Ok(undefined);
		},
	};
};

async function invoke<T>(
	command: string,
): Promise<Result<T, MediaRecorderErrProperties>> {
	return tryAsyncMediaRecorderService({
		try: async () => await tauriInvoke<T>(command),
		catch: (error) => ({
			_tag: 'MediaRecorderError',
			title: '🎤 Device Access Error',
			description:
				'Oops! We need permission to see your microphones. Check your browser settings and try again!',
			error,
		}),
	});
}

async function getFirstAvailableStream() {
	const recordingDevicesResult = await tryAsyncMediaRecorderService({
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
			_tag: 'MediaRecorderError',
			title:
				'Error enumerating recording devices and acquiring first available stream',
			description:
				'Please make sure you have given permission to access your audio devices',
			error,
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
	return MediaRecorderServiceErr({
		_tag: 'MediaRecorderError',
		title: '🎤 Microphone Access Error',
		description: 'Unable to connect to your selected microphone',
		error: undefined,
	});
}

async function getStreamForDeviceId(recordingDeviceId: string) {
	return tryAsyncMediaRecorderService({
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
			_tag: 'MediaRecorderError',
			title: '🎤 Microphone Access Error',
			description: 'Unable to connect to your selected microphone',
			error,
		}),
	});
}
