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
		const openRecordingSessionToastId = nanoid();
		if (!settings.value.selectedAudioInputDeviceId) {
			toast.loading({
				id: openRecordingSessionToastId,
				title: 'No device selected',
				description: 'Defaulting to first available audio input device...',
			});
		}

		await MediaRecorderService.initRecordingSession(
			{
				deviceId: settings.value.selectedAudioInputDeviceId,
				bitsPerSecond: Number(settings.value.bitrateKbps) * 1000,
			},
			{
				onMutate: () => {
					toast.loading({
						id: openRecordingSessionToastId,
						title: 'Connecting to selected audio input device...',
						description: 'Please allow access to your microphone if prompted.',
					});
				},
				onSuccess: () => {
					setRecorderState('SESSION+RECORDING');
					toast.success({
						id: openRecordingSessionToastId,
						title: 'Connected to selected audio input device',
						description: 'Successfully connected to your microphone stream.',
					});
				},
				onError: renderErrAsToast,
				onSettled: () => {},
			},
		);
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
		async closeRecordingSession() {
			if (!recorder.isInRecordingSession) {
				return renderErrAsToast({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to close at the moment",
					action: { type: 'none' },
				});
			}
			await MediaRecorderService.closeRecordingSession(undefined, {
				onMutate: () => {},
				onSuccess: () => {
					setRecorderState('IDLE');
				},
				onError: renderErrAsToast,
				onSettled: () => {},
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
				const addRecordingAndTranscribeResultToastId = nanoid();

				await MediaRecorderService.stopRecording(undefined, {
					onMutate: () => {},
					onSuccess: (blob: Blob) => {
						setRecorderState('IDLE');
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

						void recordings.addRecording(newRecording, {
							onMutate: () => {},
							onSuccess: () => {
								toast.loading({
									id: addRecordingAndTranscribeResultToastId,
									title: 'Recording added!',
									description: 'Your recording has been added successfully.',
								});
								recordings.transcribeRecording(newRecording.id, {
									onMutate: () => {},
									onSuccess: () => {
										toast.success({
											id: addRecordingAndTranscribeResultToastId,
											title: 'Recording transcribed!',
											description:
												'Your recording has been transcribed successfully.',
										});
									},
									onError: renderErrAsToast,
									onSettled: () => {},
								});
							},
							onError: renderErrAsToast,
							onSettled: () => {},
						});
					},
					onError: renderErrAsToast,
					onSettled: () => {},
				});
				if (!settings.value.isFasterRerecordEnabled) {
					await MediaRecorderService.closeRecordingSession(undefined, {
						onMutate: () => {},
						onSuccess: () => {
							setRecorderState('IDLE');
						},
						onError: renderErrAsToast,
						onSettled: () => {},
					});
				}
			} else {
				const newRecordingId = nanoid();

				const startNewSessionAndRecording = async () => {
					await openRecordingSession();
					await MediaRecorderService.startRecording(
						{ recordingId: newRecordingId },
						{
							onMutate: () => {},
							onSuccess: onStartSuccess,
							onError: renderErrAsToast,
							onSettled: () => {},
						},
					);
					return Ok(undefined);
				};

				if (!settings.value.isFasterRerecordEnabled) {
					await startNewSessionAndRecording();
				} else {
					if (!recorder.isInRecordingSession) {
						await startNewSessionAndRecording();
					} else {
						await MediaRecorderService.startRecording(
							{ recordingId: newRecordingId },
							{
								onMutate: () => {},
								onSuccess: onStartSuccess,
								onError: renderErrAsToast,
								onSettled: () => {},
							},
						);
					}
				}
			}
		},
		async cancelRecording() {
			if (!recorder.isInRecordingSession) {
				return renderErrAsToast({
					_tag: 'WhisperingError',
					title: '❌ No Active Session',
					description: "There's no recording session to cancel at the moment",
					action: { type: 'none' },
				});
			}

			await MediaRecorderService.cancelRecording(undefined, {
				onMutate: () => {},
				onSuccess: () => {
					void playSound('cancel');
					console.info('Recording cancelled');
					setRecorderState('IDLE');
				},
				onError: renderErrAsToast,
				onSettled: () => {},
			});

			if (!settings.value.isFasterRerecordEnabled) {
				await MediaRecorderService.closeRecordingSession(undefined, {
					onMutate: () => {},
					onSuccess: () => {
						setRecorderState('IDLE');
					},
					onError: renderErrAsToast,
					onSettled: () => {},
				});
			}
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
