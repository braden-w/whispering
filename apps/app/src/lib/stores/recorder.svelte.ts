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
import type { Recording } from '../services/RecordingDbService';
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
	const setRecorderState = (newValue: WhisperingRecordingState) => {
		recorderState = newValue;
		(async () => {
			const result = await SetTrayIconService.setTrayIcon(newValue);
			if (!result.ok) renderErrAsToast(result.error);
		})();
	};

	async function openRecordingSession() {
		const recordingSessionToastId = nanoid();
		const updateRecordingSessionToast: typeof toast.loading = (toastOptions) =>
			toast.loading({ ...toastOptions, id: recordingSessionToastId });
		await MediaRecorderService.initRecordingSession(
			{
				deviceId: settings.value.selectedAudioInputDeviceId,
				bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
			},
			{
				onSuccess: () => {
					setRecorderState('SESSION');
					toast.success({
						id: recordingSessionToastId,
						title: 'Recording session opened',
						description: 'Your recording session has been opened',
					});
				},
				onError: renderErrAsToast,
				sendUpdateStatus: updateRecordingSessionToast,
			},
		);
	}

	async function closeRecordingSession() {
		const closeRecordingSessionToastId = nanoid();
		const updateCloseRecordingSessionToast: typeof toast.loading = (
			toastOptions,
		) => toast.loading({ ...toastOptions, id: closeRecordingSessionToastId });
		if (!recorder.isInRecordingSession) {
			return renderErrAsToast({
				_tag: 'WhisperingError',
				title: '❌ No Active Session',
				description: "There's no recording session to close at the moment",
				action: { type: 'none' },
			});
		}
		await MediaRecorderService.closeRecordingSession(undefined, {
			onSuccess: () => {
				setRecorderState('IDLE');
				toast.success({
					id: closeRecordingSessionToastId,
					title: 'Recording session closed',
					description: 'Your recording session has been closed',
				});
			},
			onError: renderErrAsToast,
			sendUpdateStatus: updateCloseRecordingSessionToast,
		});
	}

	async function toggleRecording(): Promise<void> {
		const toggleRecordingToastId = nanoid();
		const updateToggleRecordingToast: typeof toast.loading = (toastOptions) =>
			toast.loading({ ...toastOptions, id: toggleRecordingToastId });

		if (recorderState === 'SESSION+RECORDING') {
			await MediaRecorderService.stopRecording(undefined, {
				onSuccess: async (blob: Blob) => {
					setRecorderState('SESSION');
					console.info('Recording stopped');
					void playSound('stop');

					const newRecording: Recording = {
						id: nanoid(),
						title: '',
						subtitle: '',
						timestamp: new Date().toISOString(),
						transcribedText: '',
						blob,
						transcriptionStatus: 'UNPROCESSED',
					};

					await recordings.addAndTranscribeRecording(newRecording, {
						sendUpdateStatus: updateToggleRecordingToast,
					});
				},
				onError: renderErrAsToast,
				sendUpdateStatus: updateToggleRecordingToast,
			});
			if (!settings.value.isFasterRerecordEnabled) {
				await MediaRecorderService.closeRecordingSession(undefined, {
					onSuccess: () => {
						setRecorderState('IDLE');
					},
					onError: renderErrAsToast,
					sendUpdateStatus: updateToggleRecordingToast,
				});
			}
		} else {
			if (!settings.value.isFasterRerecordEnabled) {
				await openRecordingSession();
				await startRecording();
			} else {
				if (!recorder.isInRecordingSession) {
					await startRecording();
					await startRecording();
				} else {
					await startRecording();
				}
			}

			async function startRecording() {
				await MediaRecorderService.startRecording(nanoid(), {
					onSuccess: () => {
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
					},
					onError: renderErrAsToast,
					sendUpdateStatus: updateToggleRecordingToast,
				});
			}
		}
	}

	async function cancelRecording() {
		const cancelRecordingToastId = nanoid();
		const updateCancelRecordingToast: typeof toast.loading = (toastOptions) =>
			toast.loading({ ...toastOptions, id: cancelRecordingToastId });
		if (!recorder.isInRecordingSession) {
			return renderErrAsToast({
				_tag: 'WhisperingError',
				title: '❌ No Active Session',
				description: "There's no recording session to cancel at the moment",
				action: { type: 'none' },
			});
		}

		await MediaRecorderService.cancelRecording(undefined, {
			onSuccess: () => {
				void playSound('cancel');
				console.info('Recording cancelled');
				setRecorderState('IDLE');
			},
			onError: renderErrAsToast,
			sendUpdateStatus: updateCancelRecordingToast,
		});

		if (!settings.value.isFasterRerecordEnabled) {
			await MediaRecorderService.closeRecordingSession(undefined, {
				onSuccess: () => {
					setRecorderState('IDLE');
					toast.success({
						id: cancelRecordingToastId,
						title: 'Recording cancelled',
						description: 'Your recording has been cancelled',
					});
				},
				onError: renderErrAsToast,
				sendUpdateStatus: updateCancelRecordingToast,
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
