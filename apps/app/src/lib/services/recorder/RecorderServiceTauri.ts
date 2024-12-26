import { Err, Ok, tryAsync } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { RecorderService } from '.';

export const createRecorderServiceTauri = (): RecorderService => {
	return {
		enumerateRecordingDevices: async () => {
			const invokeResult = await invoke<string[]>(
				'enumerate_recording_devices',
			);
			if (!invokeResult.ok) {
				return WhisperingErr({
					title: '🎤 Device Access Error',
					description:
						'Oops! We need permission to see your microphones. Check your browser settings and try again!',
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
			{ sendStatus: sendUpdateStatus },
		) => {
			sendUpdateStatus({
				title: '🎤 Setting Up',
				description:
					'Initializing your recording session and checking microphone access...',
			});
			const result = await invoke('init_recording_session', {
				settings: {
					deviceName: 'MacBook Pro Microphone',
					// deviceName: settings.deviceId,
					bitsPerSample: settings.bitsPerSecond,
				},
			});
			if (!result.ok)
				return WhisperingErr({
					title: '🎤 Unable to Start Recording Session',
					description:
						'We encountered an issue while setting up your recording session. This could be because:\n\n• Your microphone is being used by another app\n• Your microphone permissions are denied\n• The selected recording device is disconnected',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
		closeRecordingSession: async (_, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🔄 Closing Session',
				description:
					'Safely closing your recording session and freeing up resources...',
			});
			const result = await invoke('close_recording_session');
			if (!result.ok)
				return WhisperingErr({
					title: '⚠️ Session Close Failed',
					description:
						'Unable to properly close the recording session. Please try again.',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
		startRecording: async (recordingId, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🎯 Starting Up',
				description: 'Preparing your microphone and initializing recording...',
			});
			const result = await invoke('start_recording', {
				recordingId,
			});
			if (!result.ok)
				return WhisperingErr({
					title: '🎤 Recording Start Failed',
					description:
						'Unable to start recording. Please check your microphone and try again.',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
		stopRecording: async (_, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '⏸️ Finishing Up',
				description:
					'Saving your recording and preparing the final audio file...',
			});
			const result = await invoke<number[]>('stop_recording');
			console.log('🚀 ~ stopRecording: ~ result:', result);
			if (!result.ok)
				return WhisperingErr({
					title: '⏹️ Recording Stop Failed',
					description: 'Unable to save your recording. Please try again.',
					action: { type: 'more-details', error: result.error },
				});

			const uint8Array = new Uint8Array(result.data);
			const blob = new Blob([uint8Array], { type: 'audio/wav' });
			return Ok(blob);
		},
		cancelRecording: async (_, { sendStatus: sendUpdateStatus }) => {
			sendUpdateStatus({
				title: '🛑 Cancelling',
				description:
					'Safely stopping your recording and cleaning up resources...',
			});
			const result = await invoke('cancel_recording');
			if (!result.ok)
				return WhisperingErr({
					title: '⚠️ Cancel Failed',
					description:
						'Unable to cancel the recording. Please try closing the app and starting again.',
					action: { type: 'more-details', error: result.error },
				});
			return Ok(undefined);
		},
	};
};

async function invoke<T>(command: string, args?: Record<string, unknown>) {
	return tryAsync({
		try: async () => await tauriInvoke<T>(command, args),
		mapErr: (error) =>
			Err({ _tag: 'TauriInvokeError', command, error } as const),
	});
}
