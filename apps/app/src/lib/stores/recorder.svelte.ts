import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { MediaRecorderService } from '$lib/services/MediaRecorderService';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { createMutation, recordings } from '$lib/stores/recordings.svelte';
import { settings } from '$lib/stores/settings.svelte';
import {
	Ok,
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
import type { UpdateStatusMessageFn } from '$lib/services/MediaRecorderServiceWeb';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

const createActionStatuses = ({
	title: initialTitle,
	description: initialDescription,
}: {
	title: string;
	description: string;
}) => {
	const toastId = nanoid();
	toast.loading({
		id: toastId,
		title: initialTitle,
		description: initialDescription,
	});

	const updateStatus: UpdateStatusMessageFn = (message) =>
		toast.loading({ id: toastId, title: initialTitle, description: message });
	const succeedStatus = ({
		title,
		description,
	}: {
		title: string;
		description: string;
	}) => toast.success({ id: toastId, title, description });
	const errorStatus = ({
		title,
		description,
	}: {
		title: string;
		description: string;
	}) => toast.error({ id: toastId, title, description });
	updateStatus('');
	return { updateStatus, succeedStatus, errorStatus };
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
		mutationFn: (_, { context: { updateStatus } }) =>
			MediaRecorderService.closeRecordingSession(undefined, {
				sendStatus: updateStatus,
			}),
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to close at the moment",
				});
			}
			const actionStatuses = createActionStatuses({
				title: 'Closing recording session...',
				description: '',
			});
			return Ok(actionStatuses);
		},
		onSuccess: (_, { context: { succeedStatus } }) => {
			setRecorderState('IDLE');
			succeedStatus({
				title: 'Recording session closed',
				description: 'Your recording session has been closed',
			});
		},
		onError: (error) => renderErrAsToast(error),
	});

	const { mutate: startRecording } = createMutation({
		mutationFn: async (_, { context: { updateStatus } }) => {
			if (!isInRecordingSession) {
				updateStatus('Initializing recording session...');
				const initResult = await MediaRecorderService.initRecordingSession(
					{
						deviceId: settings.value.selectedAudioInputDeviceId,
						bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
					},
					{ sendStatus: updateStatus },
				);
				if (!initResult.ok) return initResult;
			}
			updateStatus('Starting recording...');
			return MediaRecorderService.startRecording(nanoid(), {
				sendStatus: updateStatus,
			});
		},
		onMutate: () => {
			const actionStatuses = createActionStatuses({
				title: 'Starting recording...',
				description: '',
			});
			return Ok(actionStatuses);
		},
		onSuccess: (_, { context: { succeedStatus } }) => {
			setRecorderState('SESSION+RECORDING');
			succeedStatus({
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
		onError: (error) => renderErrAsToast(error),
	});

	const { mutate: stopRecording } = createMutation({
		mutationFn: async (_, { context: { updateStatus } }) => {
			updateStatus('Stopping recording...');
			const stopResult = await MediaRecorderService.stopRecording(undefined, {
				sendStatus: updateStatus,
			});
			if (!stopResult.ok) return stopResult;
			updateStatus('Adding recording to database...');
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
				updateStatus('Closing recording session...');
				return MediaRecorderService.closeRecordingSession(undefined, {
					sendStatus: updateStatus,
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			const actionStatuses = createActionStatuses({
				title: 'Stopping recording...',
				description: '',
			});
			return Ok(actionStatuses);
		},
		onSuccess: (_, { context: { succeedStatus } }) => {
			setRecorderState(
				settings.value.isFasterRerecordEnabled ? 'SESSION' : 'IDLE',
			);
			succeedStatus({
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
		mutationFn: (_, { context: { updateStatus } }) =>
			MediaRecorderService.cancelRecording(undefined, {
				sendStatus: updateStatus,
			}),
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to cancel at the moment",
				});
			}
			const actionStatuses = createActionStatuses({
				title: 'Cancelling recording...',
				description: '',
			});
			return Ok(actionStatuses);
		},
		onSuccess: async (_, { context: { updateStatus, succeedStatus } }) => {
			void playSound('cancel');
			console.info('Recording cancelled');
			setRecorderState('SESSION');
			succeedStatus({
				title: 'Recording cancelled',
				description:
					'Your recording has been cancelled, session has been kept open',
			});
			if (settings.value.isFasterRerecordEnabled) return;

			updateStatus('Recording cancelled, closing recording session...');
			const closeResult = await MediaRecorderService.closeRecordingSession(
				undefined,
				{ sendStatus: updateStatus },
			);
			if (!closeResult.ok) {
				renderErrAsToast(closeResult.error);
				return;
			}
			setRecorderState('IDLE');
			succeedStatus({
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
