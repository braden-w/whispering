import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { MediaRecorderService } from '$lib/services/MediaRecorderService';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
import { toast } from '$lib/services/ToastService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { recordings } from '$lib/stores/recordings.svelte';
import { settings } from '$lib/stores/settings.svelte';
import {
	Ok,
	WhisperingErr,
	type WhisperingErrProperties,
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
import type { UpdateStatusMessageFn } from '$lib/services/MediaRecorderServiceWeb';
import type { Result } from '@epicenterhq/result';

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

const createMutation = <I, O, ServiceError, TContext>({
	mutationFn,
	onMutate = () => Ok({} as TContext),
	onSuccess = () => undefined,
	onError = () => undefined,
	onSettled = () => undefined,
}: {
	mutationFn: (input: I, context: TContext) => Promise<Result<O, ServiceError>>;
	onMutate?: (
		input: I,
	) => Promise<Result<TContext, ServiceError>> | Result<TContext, ServiceError>;
	onSuccess?: (data: O, input: I, context: TContext) => void;
	onError?: (
		error: ServiceError,
		input: I,
		context: Result<TContext, ServiceError>,
	) => void;
	onSettled?: (
		result: Result<O, ServiceError>,
		input: I,
		context: Result<TContext, ServiceError>,
	) => void;
}) => {
	const mutate = async (input: I): Promise<void> => {
		const contextResult = await onMutate(input);
		if (!contextResult.ok) {
			onError(contextResult.error, input, contextResult);
			onSettled(contextResult, input, contextResult);
			return;
		}
		const context = contextResult.data;
		const result = await mutationFn(input, context);
		if (!result.ok) {
			onError(result.error, input, contextResult);
			onSettled(result, input, contextResult);
			return;
		}
		onSuccess(result.data, input, context);
		onSettled(result, input, contextResult);
	};
	return { mutate };
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
		mutationFn: (_, { updateStatus }) =>
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
		onSuccess: (_data, _input, { succeedStatus }) => {
			setRecorderState('IDLE');
			succeedStatus({
				title: 'Recording session closed',
				description: 'Your recording session has been closed',
			});
		},
		onError: renderErrAsToast,
	});

	async function toggleRecording(): Promise<void> {
		if (recorderState === 'SESSION+RECORDING') {
			const stopRecordingToastId = nanoid();
			const updateStopRecordingStatus: UpdateStatusMessageFn = ({ message }) =>
				toast.loading({
					id: stopRecordingToastId,
					title: 'Stopping recording...',
					description: message,
				});
			updateStopRecordingStatus({ message: '' });
			const stopResult = await MediaRecorderService.stopRecording(undefined, {
				setStatusMessage: updateStopRecordingStatus,
			});
			if (!stopResult.ok) {
				return renderErrAsToast({
					_tag: 'WhisperingError',
					title: 'Unable to stop recording',
					description: 'Please check the error details for more information',
					action: { type: 'more-details', error: stopResult.error },
				});
			}
			setRecorderState('SESSION');
			console.info('Recording stopped');
			void playSound('stop');
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
				return renderErrAsToast(addRecordingResult.error);
			}
			updateStopRecordingStatus({ message: 'Recording added!' });
			await recordings.transcribeRecording(newRecording.id);
			if (!settings.value.isFasterRerecordEnabled) {
				const closeRecordingSessionResult =
					await MediaRecorderService.closeRecordingSession(undefined, {
						setStatusMessage: updateStopRecordingStatus,
					});
				if (!closeRecordingSessionResult.ok) {
					return renderErrAsToast(closeRecordingSessionResult.error);
				}
				setRecorderState('IDLE');
			}
		} else {
			const startRecordingToastId = nanoid();
			const updateStartRecordingToast: UpdateStatusMessageFn = ({ message }) =>
				toast.loading({
					id: startRecordingToastId,
					title: 'Starting recording...',
					description: message,
				});
			updateStartRecordingToast({ message: '' });

			if (!isInRecordingSession) {
				const initRecordingSessionResult =
					await MediaRecorderService.initRecordingSession(
						{
							deviceId: settings.value.selectedAudioInputDeviceId,
							bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
						},
						{ setStatusMessage: updateStartRecordingToast },
					);

				if (!initRecordingSessionResult.ok) {
					return renderErrAsToast(initRecordingSessionResult.error);
				}
				setRecorderState('SESSION');
				toast.loading({
					id: startRecordingToastId,
					title: 'Recording session opened!',
					description:
						'Your recording session has been opened, starting recording...',
				});
			}
			const startRecordingResult = await MediaRecorderService.startRecording(
				nanoid(),
				{ setStatusMessage: updateStartRecordingToast },
			);
			if (!startRecordingResult.ok) {
				return renderErrAsToast(startRecordingResult.error);
			}
			setRecorderState('SESSION+RECORDING');
			toast.success({
				id: startRecordingToastId,
				title: 'Recording started!',
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
		}
	}

	async function cancelRecording() {
		const cancelRecordingToastId = nanoid();
		const updateCancelRecordingToast: UpdateStatusMessageFn = ({ message }) =>
			toast.loading({
				id: cancelRecordingToastId,
				title: 'Cancelling recording...',
				description: message,
			});
		updateCancelRecordingToast({ message: '' });
		if (!isInRecordingSession) {
			return renderErrAsToast({
				_tag: 'WhisperingError',
				title: '❌ No Active Session',
				description: "There's no recording session to cancel at the moment",
				action: { type: 'none' },
			});
		}

		const cancelRecordingResult = await MediaRecorderService.cancelRecording(
			undefined,
			{ setStatusMessage: updateCancelRecordingToast },
		);
		if (!cancelRecordingResult.ok) {
			return renderErrAsToast(cancelRecordingResult.error);
		}
		void playSound('cancel');
		console.info('Recording cancelled');
		setRecorderState('SESSION');
		toast.success({
			id: cancelRecordingToastId,
			title: 'Recording cancelled',
			description:
				'Your recording has been cancelled, session has been kept open',
		});

		if (settings.value.isFasterRerecordEnabled) return;
		updateCancelRecordingToast({
			message: 'Canceled recording, closing recording session...',
		});
		const closeRecordingSessionResult =
			await MediaRecorderService.closeRecordingSession(undefined, {
				setStatusMessage: updateCancelRecordingToast,
			});
		if (!closeRecordingSessionResult.ok) {
			return renderErrAsToast(closeRecordingSessionResult.error);
		}
		setRecorderState('IDLE');
		toast.success({
			id: cancelRecordingToastId,
			title: 'Recording cancelled',
			description: 'Your recording has been cancelled, session has been closed',
		});
	}

	return {
		get recorderState() {
			return recorderState;
		},
		get isInRecordingSession() {
			return isInRecordingSession;
		},
		closeRecordingSession,
		toggleRecording,
		cancelRecording,
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
