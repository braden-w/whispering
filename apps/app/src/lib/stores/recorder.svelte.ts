import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { MediaRecorderService } from '$lib/services/MediaRecorderService';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { settings } from '$lib/stores/settings.svelte';
import { createLocalToastFns } from '$lib/utils';
import { Ok, createMutation } from '@epicenterhq/result';
import {
	WhisperingErr,
	type WhisperingRecordingState,
	type WhisperingResult,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

function createRecorder() {
	let recorderState = $state<WhisperingRecordingState>('IDLE');
	const isInRecordingSession = $derived(
		recorderState === 'SESSION+RECORDING' || recorderState === 'SESSION',
	);
	const setRecorderState = (newValue: WhisperingRecordingState) => {
		recorderState = newValue;
		(async () => {
			const result = await SetTrayIconService.setTrayIcon(newValue);
			if (!result.ok) {
				renderErrAsToast({
					variant: 'warning',
					title: `Could not set tray icon to ${recorderState} icon...`,
					description: 'Please check your system tray settings',
					action: { type: 'more-details', error: result.error },
				});
			}
		})();
	};

	const closeRecordingSession = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const result = await MediaRecorderService.closeRecordingSession(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!result.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Failed to Close Recording Session',
					description:
						'Unable to properly close the recording session. This may affect future recordings. Please try restarting the application if issues persist.',
					action: { type: 'more-details', error: result.error },
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Recording Session',
					description:
						"Cannot close a recording session because there isn't one currently active. Try starting a new recording first.",
				});
			}
			const localToast = createLocalToastFns();
			localToast.loading({
				title: '⏳ Closing recording session...',
				description: 'Wrapping things up, just a moment...',
			});
			return Ok({ localToast });
		},
		onSuccess: (_, { context: { localToast } }) => {
			setRecorderState('IDLE');
			localToast.success({
				title: '✨ Session Closed Successfully',
				description: 'Your recording session has been neatly wrapped up',
			});
		},
		onError: (error, { contextResult }) => {
			if (!contextResult.ok) {
				toast.error(contextResult.error);
				return;
			}
			const { localToast } = contextResult.data;
			localToast.error(error);
		},
	});

	const startRecording = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			if (!isInRecordingSession) {
				const initResult = await MediaRecorderService.initRecordingSession(
					{
						deviceId: settings.value.selectedAudioInputDeviceId,
						bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
					},
					{ sendStatus: localToast.loading },
				);
				if (!initResult.ok) {
					return WhisperingErr({
						_tag: 'WhisperingError',
						title: '❌ Failed to Initialize Recording Session',
						description:
							'Could not start a new recording session. This might be due to microphone permissions or device connectivity issues. Please check your audio settings and try again.',
						action: { type: 'more-details', error: initResult.error },
					});
				}
			}
			const result = await MediaRecorderService.startRecording(nanoid(), {
				sendStatus: localToast.loading,
			});
			if (!result.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Failed to Start Recording',
					description:
						'Unable to begin recording audio. Please check if your microphone is properly connected and permissions are granted.',
					action: { type: 'more-details', error: result.error },
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			const localToast = createLocalToastFns();
			localToast.loading({
				title: '🎙️ Preparing to record...',
				description: 'Setting up your recording environment...',
			});
			return Ok({ localToast });
		},
		onSuccess: (_, { context: { localToast } }) => {
			setRecorderState('SESSION+RECORDING');
			localToast.success({
				title: '🎯 Recording Started!',
				description: 'Your voice is being captured crystal clear',
			});
			console.info('Recording started');
			void playSound('start');
			void NotificationService.notify({
				variant: 'info',
				id: IS_RECORDING_NOTIFICATION_ID,
				title: '🎙️ Whispering is recording...',
				description: 'Click to go to recorder',
				action: {
					type: 'link',
					label: 'Go to recorder',
					goto: '/',
				},
			});
		},
		onError: (error, { contextResult }) => {
			if (!contextResult.ok) {
				toast.error(contextResult.error);
				return;
			}
			const { localToast } = contextResult.data;
			localToast.error(error);
		},
	});

	const stopRecording = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const stopResult = await MediaRecorderService.stopRecording(undefined, {
				sendStatus: localToast.loading,
			});
			if (!stopResult.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Failed to Stop Recording',
					description:
						'Unable to properly stop the current recording. Your audio may not have been saved correctly.',
					action: { type: 'more-details', error: stopResult.error },
				});
			}
			localToast.loading({
				title: '💾 Saving your recording...',
				description: 'Adding your recording to the library...',
			});
			const blob = stopResult.data;
			const newRecording: Recording = {
				id: nanoid(),
				title: '',
				subtitle: '',
				timestamp: new Date().toISOString(),
				transcribedText: '',
				blob,
				transcriptionStatus: 'UNPROCESSED',
			};
			const addRecordingResult = await Recordings.addRecording(newRecording);
			if (!addRecordingResult.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Failed to Save Recording',
					description:
						'Your recording was completed but could not be saved to the library. This might be due to storage limitations or permissions.',
					action: { type: 'more-details', error: addRecordingResult.error },
				});
			}
			void RecordingsService.transcribeRecording(newRecording);
			if (!settings.value.isFasterRerecordEnabled) {
				localToast.loading({
					title: '⏳ Closing session...',
					description: 'Wrapping up your recording session...',
				});
				const closeResult = await MediaRecorderService.closeRecordingSession(
					undefined,
					{ sendStatus: localToast.loading },
				);
				if (!closeResult.ok) {
					return WhisperingErr({
						_tag: 'WhisperingError',
						title: '❌ Failed to Close Session After Recording',
						description:
							'Your recording was saved but we encountered an issue while closing the session. You may need to restart the application.',
						action: { type: 'more-details', error: closeResult.error },
					});
				}
			}
			return Ok(undefined);
		},
		onMutate: () => {
			const localToast = createLocalToastFns();
			localToast.loading({
				title: '⏸️ Stopping recording...',
				description: 'Finalizing your audio capture...',
			});
			return Ok({ localToast });
		},
		onSuccess: (_, { context: { localToast } }) => {
			setRecorderState(
				settings.value.isFasterRerecordEnabled ? 'SESSION' : 'IDLE',
			);
			localToast.success({
				title: '✨ Recording Complete!',
				description: settings.value.isFasterRerecordEnabled
					? 'Recording saved! Ready for another take'
					: 'Recording saved and session closed successfully',
			});
			console.info('Recording stopped');
			void playSound('stop');
		},
		onError: (error, { contextResult }) => {
			if (!contextResult.ok) {
				toast.error(contextResult.error);
				return;
			}
			const { localToast } = contextResult.data;
			localToast.error(error);
		},
	});

	const cancelRecording = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const cancelResult = await MediaRecorderService.cancelRecording(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!cancelResult.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Failed to Cancel Recording',
					description:
						'Unable to cancel the current recording. The recording may still be in progress. Try stopping it instead.',
					action: { type: 'more-details', error: cancelResult.error },
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Recording to Cancel',
					description:
						"Cannot cancel recording because there isn't one currently in progress.",
				});
			}
			const localToast = createLocalToastFns();
			localToast.loading({
				title: '🔄 Cancelling recording...',
				description: 'Discarding the current recording...',
			});
			return Ok({ localToast });
		},
		onSuccess: async (_, { context: { localToast } }) => {
			void playSound('cancel');
			console.info('Recording cancelled');
			setRecorderState('SESSION');
			localToast.success({
				title: '🚫 Recording Cancelled',
				description:
					'Recording discarded, but session remains open for a new take',
			});
			if (settings.value.isFasterRerecordEnabled) return;

			localToast.loading({
				title: '⏳ Closing session...',
				description: 'Wrapping up your recording session...',
			});
			const closeResult = await MediaRecorderService.closeRecordingSession(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!closeResult.ok) {
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: '❌ Failed to Close Session',
					description: 'We encountered an issue while closing your session',
					action: { type: 'more-details', error: closeResult.error },
				});
				return;
			}
			setRecorderState('IDLE');
			localToast.success({
				title: '✅ All Done!',
				description: 'Recording cancelled and session closed successfully',
			});
		},
		onError: (error, { contextResult }) => {
			if (!contextResult.ok) {
				toast.error(contextResult.error);
				return;
			}
			const { localToast } = contextResult.data;
			localToast.error(error);
		},
	});

	return {
		get recorderState() {
			return recorderState;
		},
		get isInRecordingSession() {
			return isInRecordingSession;
		},
		closeRecordingSession,
		toggleRecording() {
			if (isInRecordingSession) {
				stopRecording(undefined);
			} else {
				startRecording(undefined);
			}
		},
		cancelRecording: () => cancelRecording(undefined),
	};
}

async function playSound(
	sound: 'start' | 'stop' | 'cancel',
): Promise<WhisperingResult<void>> {
	if (!settings.value.isPlaySoundEnabled) return Ok(undefined);

	if (!document.hidden) {
		switch (sound) {
			case 'start':
				await startSound.play();
				break;
			case 'stop':
				await stopSound.play();
				break;
			case 'cancel':
				await cancelSound.play();
				break;
		}
		return Ok(undefined);
	}

	const sendMessageToExtensionResult = await sendMessageToExtension({
		name: 'whispering-extension/playSound',
		body: { sound },
	});

	if (!sendMessageToExtensionResult.ok) return sendMessageToExtensionResult;
	return Ok(undefined);
}
