import { Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';
import type {
	RecorderService,
	RecordingSessionSettings,
	UpdateStatusMessageFn,
} from './RecorderService';
import { extension } from '@repo/extension';

const TIMESLICE_MS = 1000;
const PREFERRED_NAVIGATOR_MEDIA_DEVICES_USER_MEDIA_OPTIONS = {
	channelCount: { ideal: 1 },
	sampleRate: { ideal: 16000 },
} satisfies MediaTrackConstraints;

type RecordingSession = {
	settings: RecordingSessionSettings;
	stream: MediaStream;
	recorder: {
		mediaRecorder: MediaRecorder;
		recordedChunks: Blob[];
		recordingId: string;
	} | null;
};

export function createRecorderServiceWeb(): RecorderService {
	let currentSession: RecordingSession | null = null;

	const acquireStream = async (
		settings: RecordingSessionSettings,
		{ sendStatus }: { sendStatus: UpdateStatusMessageFn },
	): Promise<WhisperingResult<MediaStream>> => {
		if (!settings.deviceId) {
			sendStatus({
				title: '🔍 No Device Selected',
				description:
					"No worries! We'll find the best microphone for you automatically...",
			});
			const getFirstStreamResult = await getFirstAvailableStream();
			if (!getFirstStreamResult.ok) {
				return WhisperingErr({
					title: '🚫 Stream Error',
					description:
						"Hmm... We couldn't find any microphones to use. Check your connections and try again!",
					action: { type: 'more-details', error: getFirstStreamResult.error },
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
				title: '⚠️ Finding a New Microphone',
				description:
					"That microphone isn't working. Let's try finding another one...",
			});
			const getFirstStreamResult = await getFirstAvailableStream();
			if (!getFirstStreamResult.ok) {
				return WhisperingErr({
					title: '🎤 No Microphone Found',
					description:
						"We couldn't connect to any microphones. Make sure they're plugged in and try again!",
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
		enumerateRecordingDevices,

		initRecordingSession: async (settings, { sendStatus }) => {
			const acquireStreamResult = await acquireStream(settings, {
				sendStatus,
			});
			if (!acquireStreamResult.ok) return acquireStreamResult;
			const stream = acquireStreamResult.data;
			currentSession = { settings, stream, recorder: null };
			return Ok(undefined);
		},

		closeRecordingSession: async (_, { sendStatus }) => {
			if (!currentSession) return Ok(undefined);
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

		startRecording: async (recordingId, { sendStatus }) => {
			if (!currentSession) {
				return WhisperingErr({
					title: '🚫 No Active Session',
					description:
						'Looks like we need to start a new recording session first!',
				});
			}
			if (!currentSession.stream.active) {
				sendStatus({
					title: '🔄 Session Expired',
					description:
						'Your recording session timed out. Reconnecting to your microphone...',
				});
				const acquireStreamResult = await acquireStream(
					currentSession.settings,
					{ sendStatus },
				);
				if (!acquireStreamResult.ok) return acquireStreamResult;
				const stream = acquireStreamResult.data;
				currentSession = {
					settings: currentSession.settings,
					stream,
					recorder: null,
				};
			}
			sendStatus({
				title: '🎯 Getting Ready',
				description: 'Initializing your microphone and preparing to record...',
			});
			const newRecorderResult = await tryAsync({
				try: async () => {
					if (!currentSession) throw new Error('No active recording session');
					return new MediaRecorder(currentSession.stream, {
						bitsPerSecond: currentSession.settings.bitsPerSecond,
					});
				},
				mapErr: (error) =>
					WhisperingErr({
						title: '🎙️ Setup Failed',
						description:
							"Oops! Something went wrong with your microphone. Let's try that again!",
						action: { type: 'more-details', error },
					}),
			});
			if (!newRecorderResult.ok) return newRecorderResult;
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

		stopRecording: async (_, { sendStatus }) => {
			if (!currentSession?.recorder?.mediaRecorder) {
				return WhisperingErr({
					title: '⚠️ Nothing to Stop',
					description: 'No active recording found to stop',
					action: { type: 'more-details', error: undefined },
				});
			}
			sendStatus({
				title: '⏸️ Finishing Up',
				description:
					'Saving your recording and preparing the final audio file...',
			});
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
									reject(new Error('Media recorder nullified before stop'));
									return;
								}
								const audioBlob = new Blob(
									currentSession.recorder.recordedChunks,
									{ type: currentSession.recorder.mediaRecorder.mimeType },
								);
								resolve(audioBlob);
							},
						);
						currentSession.recorder.mediaRecorder.stop();
					}),
				mapErr: (error) =>
					WhisperingErr({
						title: '⏹️ Recording Stop Failed',
						description: 'Unable to save your recording. Please try again',
						action: { type: 'more-details', error },
					}),
			});
			if (!stopResult.ok) return stopResult;
			sendStatus({
				title: '✅ Recording Complete',
				description: 'Successfully saved your audio recording!',
			});
			const blob = stopResult.data;
			return Ok(blob);
		},

		cancelRecording: async (_, { sendStatus }) => {
			if (!currentSession?.recorder?.mediaRecorder) {
				return WhisperingErr({
					title: '⚠️ Nothing to Cancel',
					description: 'No active recording found to cancel',
					action: { type: 'more-details', error: undefined },
				});
			}
			sendStatus({
				title: '🛑 Cancelling',
				description: 'Safely cancelling your recording...',
			});
			currentSession.recorder.mediaRecorder.stop();
			sendStatus({
				title: '✨ Cancelled',
				description: 'Recording successfully cancelled!',
			});
			currentSession.recorder = null;
			return Ok(undefined);
		},
	};
}

async function hasExistingAudioPermission(): Promise<boolean> {
	try {
		const permissions = await navigator.permissions.query({
			name: 'microphone' as PermissionName,
		});
		return permissions.state === 'granted';
	} catch {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: PREFERRED_NAVIGATOR_MEDIA_DEVICES_USER_MEDIA_OPTIONS,
			});
			for (const track of stream.getTracks()) {
				track.stop();
			}
			return true;
		} catch {
			return false;
		}
	}
}

async function getFirstAvailableStream() {
	const enumerateDevicesResult = await enumerateRecordingDevices();
	if (!enumerateDevicesResult.ok)
		return WhisperingErr({
			title:
				'Error enumerating recording devices and acquiring first available stream',
			description:
				'Please make sure you have given permission to access your audio devices',
			action: { type: 'more-details', error: enumerateDevicesResult.error },
		});
	const recordingDevices = enumerateDevicesResult.data;
	for (const device of recordingDevices) {
		const streamResult = await getStreamForDeviceId(device.deviceId);
		if (streamResult.ok) {
			return streamResult;
		}
	}
	return WhisperingErr({
		title: '🎤 Microphone Access Error',
		description: 'Unable to connect to your selected microphone',
		action: { type: 'more-details', error: undefined },
	});
}

async function enumerateRecordingDevices() {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		void extension.openWhisperingTab({});
	}
	return tryAsync({
		try: async () => {
			const allAudioDevicesStream = await navigator.mediaDevices.getUserMedia({
				audio: PREFERRED_NAVIGATOR_MEDIA_DEVICES_USER_MEDIA_OPTIONS,
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
		mapErr: (error) =>
			WhisperingErr({
				title: '🎤 Device Access Error',
				description:
					'Oops! We need permission to see your microphones. Check your browser settings and try again!',
				action: { type: 'more-details', error },
			}),
	});
}

async function getStreamForDeviceId(recordingDeviceId: string) {
	const hasPermission = await hasExistingAudioPermission();
	if (!hasPermission) {
		void extension.openWhisperingTab({});
	}
	return tryAsync({
		try: async () => {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					deviceId: { exact: recordingDeviceId },
					...PREFERRED_NAVIGATOR_MEDIA_DEVICES_USER_MEDIA_OPTIONS,
				},
			});
			return stream;
		},
		mapErr: (error) =>
			WhisperingErr({
				title: '🎤 Microphone Access Error',
				description: 'Unable to connect to your selected microphone',
				action: { type: 'more-details', error },
			}),
	});
}
