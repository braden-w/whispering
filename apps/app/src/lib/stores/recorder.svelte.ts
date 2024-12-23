import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { MediaRecorderService } from '$lib/services/MediaRecorderService';
import type { UpdateStatusMessageFn } from '$lib/services/MediaRecorderServiceWeb';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { recordings } from '$lib/stores/recordings.svelte';
import { settings } from '$lib/stores/settings.svelte';
import type { Result } from '@epicenterhq/result';
import {
	Ok,
	WhisperingErr,
	type WhisperingRecordingState,
	type WhisperingResult,
} from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';
import {
	RecordingsDbService,
	type Recording,
} from '../services/RecordingDbService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

const createActionStatuses = ({
	title,
}: {
	title: string;
}) => {
	const toastId = nanoid();
	const updateStatus: UpdateStatusMessageFn = ({ message }) =>
		toast.loading({ id: toastId, title, description: message });
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
	updateStatus({ message: '' });
	return { updateStatus, succeedStatus, errorStatus };
};

function createMutation<I, O, ServiceError, TContext>({
	mutationFn,
	onMutate = () => Ok({} as TContext),
	onSuccess = () => undefined,
	onError = () => undefined,
	onSettled = () => undefined,
}: {
	mutationFn: (args: { input: I; context: TContext }) =>
		| Promise<Result<O, ServiceError>>
		| Result<O, ServiceError>;
	onMutate?: (
		input: I,
	) => Promise<Result<TContext, ServiceError>> | Result<TContext, ServiceError>;
	onSuccess?: (args: { output: O; input: I; context: TContext }) => void;
	onError?: (args: {
		error: ServiceError;
		input: I;
		contextResult: Result<TContext, ServiceError>;
	}) => void;
	onSettled?: (args: {
		result: Result<O, ServiceError>;
		input: I;
		contextResult: Result<TContext, ServiceError>;
	}) => void;
}) {
	const mutate = async (input: I): Promise<void> => {
		const contextResult = await onMutate(input);
		if (!contextResult.ok) {
			const error = contextResult.error;
			onError({ error, input, contextResult });
			onSettled({ result: contextResult, input, contextResult });
			return;
		}
		const context = contextResult.data;
		const result = await mutationFn({ input, context });
		if (!result.ok) {
			const error = result.error;
			onError({ error, input, contextResult });
			onSettled({ result, input, contextResult });
			return;
		}
		const output = result.data;
		onSuccess({ output, input, context });
		onSettled({ result, input, contextResult });
	};
	return { mutate };
}

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
		mutationFn: ({ context: { updateStatus } }) =>
			MediaRecorderService.closeRecordingSession(undefined, {
				setStatusMessage: updateStatus,
			}),
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to close at the moment",
					action: { type: 'none' },
				});
			}
			const actionStatuses = createActionStatuses({
				title: 'Closing recording session...',
			});
			return Ok(actionStatuses);
		},
		onSuccess: ({ context: { succeedStatus } }) => {
			setRecorderState('IDLE');
			succeedStatus({
				title: 'Recording session closed',
				description: 'Your recording session has been closed',
			});
		},
		onError: ({ error }) => renderErrAsToast(error),
	});

	const { mutate: toggleRecording } = createMutation({
		mutationFn: async ({
			input: _,
			context: { updateStatus, shouldStartRecording },
		}) => {
			if (shouldStartRecording) {
				if (!isInRecordingSession) {
					const initResult = await MediaRecorderService.initRecordingSession(
						{
							deviceId: settings.value.selectedAudioInputDeviceId,
							bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
						},
						{ setStatusMessage: updateStatus },
					);
					if (!initResult.ok) return initResult;
				}
				return MediaRecorderService.startRecording(nanoid(), {
					setStatusMessage: updateStatus,
				});
			}
			const stopResult = await MediaRecorderService.stopRecording(undefined, {
				setStatusMessage: updateStatus,
			});
			if (!stopResult.ok) return stopResult;
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
			await recordings.transcribeRecording(newRecording.id);
			if (!settings.value.isFasterRerecordEnabled) {
				return MediaRecorderService.closeRecordingSession(undefined, {
					setStatusMessage: updateStatus,
				});
			}
			return Ok(undefined);
		},
		onMutate: () => {
			const shouldStartRecording = recorderState !== 'SESSION+RECORDING';
			const actionStatuses = createActionStatuses({
				title: shouldStartRecording
					? 'Starting recording...'
					: 'Stopping recording...',
			});
			return Ok({ ...actionStatuses, shouldStartRecording });
		},
		onSuccess: ({ context: { succeedStatus, shouldStartRecording } }) => {
			if (shouldStartRecording) {
				setRecorderState('SESSION+RECORDING');
				succeedStatus({
					title: 'Recording started!',
					description: '',
				});
				console.info('Recording started');
				void playSound('start');
				void NotificationService.notify({
					id: IS_RECORDING_NOTIFICATION_ID,
					title: 'Whispering is recording...',
					description: 'Click to go to recorder',
					action: {
						type: 'link',
						label: 'Go to recorder',
						goto: '/',
					},
				});
			} else {
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
			}
		},
		onError: ({ error }) => renderErrAsToast(error),
	});

	const { mutate: cancelRecording } = createMutation({
		mutationFn: ({ context: { updateStatus } }) =>
			MediaRecorderService.cancelRecording(undefined, {
				setStatusMessage: updateStatus,
			}),
		onMutate: () => {
			if (!isInRecordingSession) {
				return WhisperingErr({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to cancel at the moment",
					action: { type: 'none' },
				});
			}
			const actionStatuses = createActionStatuses({
				title: 'Cancelling recording...',
			});
			return Ok(actionStatuses);
		},
		onSuccess: async ({ context: { updateStatus, succeedStatus } }) => {
			void playSound('cancel');
			console.info('Recording cancelled');
			setRecorderState('SESSION');
			succeedStatus({
				title: 'Recording cancelled',
				description:
					'Your recording has been cancelled, session has been kept open',
			});

			if (settings.value.isFasterRerecordEnabled) return;
			updateStatus({
				message: 'Canceled recording, closing recording session...',
			});
			const closeResult = await MediaRecorderService.closeRecordingSession(
				undefined,
				{ setStatusMessage: updateStatus },
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
		onError: ({ error }) => renderErrAsToast(error),
	});

	return {
		get recorderState() {
			return recorderState;
		},
		get isInRecordingSession() {
			return isInRecordingSession;
		},
		closeRecordingSession,
		toggleRecording: () => toggleRecording(undefined),
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
