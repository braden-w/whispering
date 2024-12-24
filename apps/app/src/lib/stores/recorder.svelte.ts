import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { MediaRecorderService } from '$lib/services/MediaRecorderService';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { createMutation, recordings } from '$lib/stores/recordings.svelte';
import { settings } from '$lib/stores/settings.svelte';
import { Ok } from '@epicenterhq/result';
import {
	type ToastOptions,
	WhisperingErr,
	type WhisperingRecordingState,
	type WhisperingResult,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import {
	type Recording,
	RecordingsDbService,
} from '../services/RecordingDbService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

/**
 * Creates a set of toast functions that are scoped to a single mutation.
 * This is useful for creating multiple toasts in a single mutation.
 */
const createLocalToastFns = () => {
	const toastId = nanoid();
	return {
		success: (options: ToastOptions) =>
			toast.success({ id: toastId, ...options }),
		error: (options: ToastOptions) => toast.error({ id: toastId, ...options }),
		loading: (options: ToastOptions) =>
			toast.loading({ id: toastId, ...options }),
	};
};

function createRecorder() {
	let recorderState = $state<WhisperingRecordingState>('IDLE');
	const isInRecordingSession = $derived(
		recorderState === 'SESSION+RECORDING' || recorderState === 'SESSION',
	);
	const setRecorderState = (newValue: WhisperingRecordingState) => {
		recorderState = newValue;
		(async () => {
			const result = await SetTrayIconService.setTrayIcon(newValue);
			if (!result.ok) renderErrAsToast(result.error);
		})();
	};

	const { mutate: closeRecordingSession } = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const result = await MediaRecorderService.closeRecordingSession(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!result.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Session Close Failed',
					description:
						'Oops! We hit a snag while closing your recording session',
					action: { type: 'more-details', error: result.error },
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to close at the moment",
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

	const { mutate: startRecording } = createMutation({
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
						title: '❌ Session Initialization Failed',
						description:
							'Oops! We hit a snag while initializing your recording session',
						action: { type: 'more-details', error: initResult.error },
					});
				}
				return Ok(undefined);
			}
			const result = await MediaRecorderService.startRecording(nanoid(), {
				sendStatus: localToast.loading,
			});
			if (!result.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Recording Failed to Start',
					description:
						'We encountered an issue while setting up your recording',
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

	const { mutate: stopRecording } = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const stopResult = await MediaRecorderService.stopRecording(undefined, {
				sendStatus: localToast.loading,
			});
			if (!stopResult.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Recording Failed to Stop',
					description: 'We encountered an issue while stopping your recording',
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
			const addRecordingResult =
				await RecordingsDbService.addRecording(newRecording);
			if (!addRecordingResult.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Failed to Save Recording',
					description: 'We encountered an issue while saving your recording',
					action: { type: 'more-details', error: addRecordingResult.error },
				});
			}
			void recordings.transcribeRecording(newRecording);
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
						title: '❌ Failed to Close Session',
						description: 'We encountered an issue while closing your session',
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

	const { mutate: cancelRecording } = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const cancelResult = await MediaRecorderService.cancelRecording(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!cancelResult.ok) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ Failed to Cancel Recording',
					description: 'We encountered an issue while canceling your recording',
					action: { type: 'more-details', error: cancelResult.error },
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to cancel at the moment",
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
