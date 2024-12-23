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

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

function createRecorder() {
	let recorderState = $state<WhisperingRecordingState>('IDLE');
	const setRecorderState = (newValue: WhisperingRecordingState) => {
		recorderState = newValue;
		(async () => {
			const result = await SetTrayIconService.setTrayIcon(newValue);
			if (!result.ok) renderErrAsToast(result.error);
		})();
	};

	async function openRecordingSession() {
		const recordingSessionToastId = nanoid();
		const updateRecordingSessionToast: UpdateStatusMessageFn = ({ message }) =>
			toast.loading({
				id: recordingSessionToastId,
				title: 'Initializing recording session...',
				description: message,
			});
		updateRecordingSessionToast({ message: '' });
		const initRecordingSessionResult =
			await MediaRecorderService.initRecordingSession(
				{
					deviceId: settings.value.selectedAudioInputDeviceId,
					bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
				},
				{ setStatusMessage: updateRecordingSessionToast },
			);

		if (!initRecordingSessionResult.ok) {
			return renderErrAsToast(initRecordingSessionResult.error);
		}
		setRecorderState('SESSION');
		toast.success({
			id: recordingSessionToastId,
			title: 'Recording session opened!',
			description: 'Your recording session has been opened',
		});
	}

	async function closeRecordingSession() {
		const closeRecordingSessionToastId = nanoid();
		const updateCloseRecordingSessionToast: UpdateStatusMessageFn = ({
			message,
		}) =>
			toast.loading({
				id: closeRecordingSessionToastId,
				title: 'Closing recording session...',
				description: message,
			});
		updateCloseRecordingSessionToast({ message: '' });
		if (!recorder.isInRecordingSession) {
			return renderErrAsToast({
				_tag: 'WhisperingError',
				title: '❌ No Active Session',
				description: "There's no recording session to close at the moment",
				action: { type: 'none' },
			});
		}
		const closeRecordingSessionResult =
			await MediaRecorderService.closeRecordingSession(undefined, {
				setStatusMessage: updateCloseRecordingSessionToast,
			});
		if (!closeRecordingSessionResult.ok) {
			return renderErrAsToast(closeRecordingSessionResult.error);
		}
		setRecorderState('IDLE');
		toast.success({
			id: closeRecordingSessionToastId,
			title: 'Recording session closed',
			description: 'Your recording session has been closed',
		});
	}

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

			const startRecording = async () => {
				const startRecordingResult = await MediaRecorderService.startRecording(
					nanoid(),
					{
						setStatusMessage: updateStartRecordingToast,
					},
				);
				if (!startRecordingResult.ok) {
					return renderErrAsToast(startRecordingResult.error);
				}
				setRecorderState('SESSION+RECORDING');
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
			};

			if (!settings.value.isFasterRerecordEnabled) {
				await openRecordingSession();
				await startRecording();
			} else {
				if (!recorder.isInRecordingSession) {
					await openRecordingSession();
					await startRecording();
				} else {
					await startRecording();
				}
			}
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
		if (!recorder.isInRecordingSession) {
			return renderErrAsToast({
				_tag: 'WhisperingError',
				title: '❌ No Active Session',
				description: "There's no recording session to cancel at the moment",
				action: { type: 'none' },
			});
		}

		const cancelRecordingResult = await MediaRecorderService.cancelRecording(
			undefined,
			{
				setStatusMessage: updateCancelRecordingToast,
			},
		);
		if (!cancelRecordingResult.ok) {
			return renderErrAsToast(cancelRecordingResult.error);
		}
		void playSound('cancel');
		console.info('Recording cancelled');
		setRecorderState('IDLE');

		if (!settings.value.isFasterRerecordEnabled) {
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
				description: 'Your recording has been cancelled',
			});
		}
	}

	return {
		get recorderState() {
			return recorderState;
		},
		get isInRecordingSession() {
			return (
				recorderState === 'SESSION+RECORDING' || recorderState === 'SESSION'
			);
		},
		openRecordingSession,
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
