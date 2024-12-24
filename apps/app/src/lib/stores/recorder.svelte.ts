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

const createToastFns = () => {
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
		mutationFn: (_, { context: { localToast } }) =>
			MediaRecorderService.closeRecordingSession(undefined, {
				sendStatus: localToast.loading,
			}),
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to close at the moment",
				});
			}
			const localToast = createToastFns();
			localToast.loading({
				title: 'Closing recording session...',
				description: '',
			});
			return Ok({ localToast });
		},
		onSuccess: (_, { context: { localToast } }) => {
			setRecorderState('IDLE');
			localToast.success({
				title: 'Recording session closed',
				description: 'Your recording session has been closed',
			});
		},
		onError: (error, { contextResult }) => {
			if (!contextResult.ok) {
				toast.error({
					title: 'Error closing recording session',
					description: 'There was an error closing your recording session',
					action: { type: 'more-details', error },
				});
				return;
			}
			const { localToast } = contextResult.data;
			localToast.error({
				title: 'Error closing recording session',
				description: 'There was an error closing your recording session',
				action: { type: 'more-details', error },
			});
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
				if (!initResult.ok) return initResult;
			}
			return MediaRecorderService.startRecording(nanoid(), {
				sendStatus: localToast.loading,
			});
		},
		onMutate: () => {
			const localToast = createToastFns();
			localToast.loading({
				title: 'Starting recording...',
				description: '',
			});
			return Ok({ localToast });
		},
		onSuccess: (_, { context: { localToast } }) => {
			setRecorderState('SESSION+RECORDING');
			localToast.success({
				title: 'Recording started!',
				description: '',
			});
			console.info('Recording started');
			void playSound('start');
			void NotificationService.notify({
				variant: 'info',
				id: IS_RECORDING_NOTIFICATION_ID,
				title: 'Whispering is recording...',
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
				toast.error({
					title: 'Error starting recording',
					description: 'There was an error starting your recording',
					action: { type: 'more-details', error },
				});
				return;
			}
			const { localToast } = contextResult.data;
			localToast.error({
				title: 'Error starting recording',
				description: 'There was an error starting your recording',
				action: { type: 'more-details', error },
			});
		},
	});

	const { mutate: stopRecording } = createMutation({
		mutationFn: async (_, { context: { localToast } }) => {
			const stopResult = await MediaRecorderService.stopRecording(undefined, {
				sendStatus: localToast.loading,
			});
			if (!stopResult.ok) return stopResult;
			localToast.loading({
				title: 'Adding recording to database...',
				description: '',
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
			if (!addRecordingResult.ok) return addRecordingResult;
			void recordings.transcribeRecording(newRecording);
			if (!settings.value.isFasterRerecordEnabled) {
				localToast.loading({
					title: 'Closing recording session...',
					description: '',
				});
				return MediaRecorderService.closeRecordingSession(undefined, {
					sendStatus: localToast.loading,
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			const localToast = createToastFns();
			localToast.loading({
				title: 'Stopping recording...',
				description: '',
			});
			return Ok({ localToast });
		},
		onSuccess: (_, { context: { localToast } }) => {
			setRecorderState(
				settings.value.isFasterRerecordEnabled ? 'SESSION' : 'IDLE',
			);
			localToast.success({
				title: 'Recording stopped',
				description: settings.value.isFasterRerecordEnabled
					? 'Recording has been stopped and saved'
					: 'Recording has been stopped, saved and session closed',
			});
			console.info('Recording stopped');
			void playSound('stop');
		},
		onError: (error) => renderErrAsToast(error),
	});

	const { mutate: cancelRecording } = createMutation({
		mutationFn: (_, { context: { localToast } }) =>
			MediaRecorderService.cancelRecording(undefined, {
				sendStatus: localToast.loading,
			}),
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to cancel at the moment",
				});
			}
			const localToast = createToastFns();
			localToast.loading({
				title: 'Cancelling recording...',
				description: '',
			});
			return Ok({ localToast });
		},
		onSuccess: async (_, { context: { localToast } }) => {
			void playSound('cancel');
			console.info('Recording cancelled');
			setRecorderState('SESSION');
			localToast.success({
				title: 'Recording cancelled',
				description:
					'Your recording has been cancelled, session has been kept open',
			});
			if (settings.value.isFasterRerecordEnabled) return;

			localToast.loading({
				title: 'Closing recording session...',
				description: '',
			});
			const closeResult = await MediaRecorderService.closeRecordingSession(
				undefined,
				{ sendStatus: localToast.loading },
			);
			if (!closeResult.ok) {
				renderErrAsToast(closeResult.error);
				return;
			}
			setRecorderState('IDLE');
			localToast.success({
				title: 'Recording cancelled',
				description:
					'Your recording has been cancelled, session has been closed',
			});
		},
		onError: (error) => renderErrAsToast(error),
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
