import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { setAlwaysOnTop } from '$lib/services/AlwaysOnTopService';
import { mediaRecorder } from '$lib/services/MediaRecorderService.svelte';
import { NotificationService } from '$lib/services/NotificationService';
import { SetTrayIconService } from '$lib/services/SetTrayIconService';
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
import { toast } from '$lib/services/ToastService';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export const recorderState = (() => {
	let value = $state<WhisperingRecordingState>('IDLE');
	return {
		get value() {
			return value;
		},
		set value(newValue: WhisperingRecordingState) {
			value = newValue;
			(async () => {
				const result = await SetTrayIconService.setTrayIcon(newValue);
				if (!result.ok) renderErrAsToast(result);
			})();
		},
	};
})();

const IS_RECORDING_NOTIFICATION_ID = 'WHISPERING_RECORDING_NOTIFICATION';

export const recorder = createRecorder();

function createRecorder() {
	return {
		get recorderState() {
			return recorderState.value;
		},

		async toggleRecording(): Promise<void> {
			if (mediaRecorder.recordingState === 'RECORDING') {
				void mediaRecorder.stopRecording({
					onSuccess: (audioBlob) => {
						recorderState.value = 'IDLE';
						console.info('Recording stopped');
						void playSound('stop');

						const newRecording: Recording = {
							id: nanoid(),
							title: '',
							subtitle: '',
							timestamp: new Date().toISOString(),
							transcribedText: '',
							blob: audioBlob,
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
				return;
			}
			void mediaRecorder.startRecording({
				onSuccess: () => {
					recorderState.value = 'RECORDING';
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
			});
		},
		cancelRecording() {
			void mediaRecorder.cancelRecording({
				onSuccess: () => {
					void playSound('cancel');
					console.info('Recording cancelled');
					recorderState.value = 'IDLE';
				},
				onError: renderErrAsToast,
			});
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
