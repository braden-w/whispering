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
import { WhisperingErr } from '@repo/shared';

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
			if (!result.ok) renderErrAsToast(result);
		})();
	};

	return {
		get recorderState() {
			return recorderState;
		},
		get isInRecordingSession() {
			return (
				recorderState === 'SESSION+RECORDING' || recorderState === 'SESSION'
			);
		},
		async openRecordingSession() {
			await MediaRecorderService.initRecordingSession(
				{
					deviceId: settings.value.selectedAudioInputDeviceId,
					bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
				},
				{
					onSuccess: () => {
						setRecorderState('SESSION+RECORDING');
					},
					onError: renderErrAsToast,
				},
			);
		},
		async closeRecordingSession() {
			if (!this.isInRecordingSession) {
				return renderErrAsToast(
					WhisperingErr({
						_tag: 'WhisperingError',
						title: '❌ No Active Session',
						description: "There's no recording session to close at the moment",
						action: { type: 'none' },
					}),
				);
			}
			await MediaRecorderService.closeRecordingSession({
				onSuccess: () => {
					setRecorderState('IDLE');
				},
				onError: renderErrAsToast,
			});
		},
		async toggleRecording(): Promise<void> {
			const onStartSuccess = () => {
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

			if (recorderState === 'SESSION+RECORDING') {
				await MediaRecorderService.stopRecording({
					onSuccess: (blob: Blob) => {
						setRecorderState('IDLE');
						console.info('Recording stopped');
						void playSound('stop');

						const newRecording: Recording = {
							id: recordingId,
							title: '',
							subtitle: '',
							timestamp: new Date().toISOString(),
							transcribedText: '',
							blob,
							transcriptionStatus: 'UNPROCESSED',
						};

						const addRecordingAndTranscribeResultToastId = nanoid();

						void recordings.addRecording(newRecording, {
							onSuccess: () => {
								toast.loading({
									id: addRecordingAndTranscribeResultToastId,
									title: 'Recording added!',
									description: 'Your recording has been added successfully.',
								});
								recordings.transcribeRecording(newRecording.id, {
									toastId: addRecordingAndTranscribeResultToastId,
								});
							},
							onError: renderErrAsToast,
						});
					},
					onError: renderErrAsToast,
				});
				if (!settings.value.isFasterRerecordEnabled) {
					const endSessionResult =
						await MediaRecorderService.closeRecordingSession();
					if (!endSessionResult.ok) {
						renderErrAsToast(endSessionResult);
						return;
					}
				}
			} else {
				const newRecordingId = nanoid();

				const startSessionAndRecording = async () => {
					await this.openRecordingSession();
					await MediaRecorderService.startRecording(
						{ recordingId: newRecordingId },
						{ onSuccess: onStartSuccess, onError: renderErrAsToast },
					);
					return Ok(undefined);
				};

				if (settings.value.isFasterRerecordEnabled) {
					if (MediaRecorderService.isInRecordingSession) {
						await MediaRecorderService.startRecording(
							{ recordingId: newRecordingId },
							{ onSuccess: onStartSuccess, onError: renderErrAsToast },
						);
					} else {
						const startSessionAndRecordingResult =
							await startSessionAndRecording();
						if (!startSessionAndRecordingResult.ok) {
							renderErrAsToast(startSessionAndRecordingResult);
							return;
						}
					}
				} else {
					const startSessionAndRecordingResult =
						await startSessionAndRecording();
					if (!startSessionAndRecordingResult.ok) {
						renderErrAsToast(startSessionAndRecordingResult);
						return;
					}
				}
			}
		},
		async cancelRecording() {
			if (!this.isInRecordingSession) {
				return renderErrAsToast(
					WhisperingErr({
						_tag: 'WhisperingError',
						title: '❌ No Active Session',
						description: "There's no recording session to cancel at the moment",
						action: { type: 'none' },
					}),
				);
			}

			const cancelResult = await MediaRecorderService.cancelRecording();
			if (!cancelResult.ok) {
				renderErrAsToast(cancelResult);
				return;
			}

			if (!settings.value.isFasterRerecordEnabled) {
				const closeRecordingSessionResult =
					await MediaRecorderService.closeRecordingSession();
				if (!closeRecordingSessionResult.ok) {
					renderErrAsToast(closeRecordingSessionResult);
					return;
				}
			}
			void playSound('cancel');
			console.info('Recording cancelled');
			setRecorderState('IDLE');
		},
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
