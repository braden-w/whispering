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

const startSound = new Audio(startSoundSrc);
console.log('🚀 ~ startSound:', startSound);
const stopSound = new Audio(stopSoundSrc);
console.log('🚀 ~ stopSound:', stopSound);
const cancelSound = new Audio(cancelSoundSrc);
console.log('🚀 ~ cancelSound:', cancelSound);

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
	const { notify } = NotificationService;

	return {
		get recorderState() {
			return recorderState.value;
		},

		async toggleRecording(): Promise<void> {
			const toggleRecording = async (): Promise<
				WhisperingResult<undefined>
			> => {
				const stopRecording = async () => {
					const stopRecordingResult = await mediaRecorder.stopRecording();
					if (!stopRecordingResult.ok) return stopRecordingResult;
					const audioBlob = stopRecordingResult.data;
					recorderState.value = 'IDLE';
					console.info('Recording stopped');
					const playSoundResult = await playSound('stop');
					if (!playSoundResult.ok) return playSoundResult;

					const newRecording: Recording = {
						id: nanoid(),
						title: '',
						subtitle: '',
						timestamp: new Date().toISOString(),
						transcribedText: '',
						blob: audioBlob,
						transcriptionStatus: 'UNPROCESSED',
					};
					await recordings.addRecording(newRecording);
					await recordings.transcribeRecording(newRecording.id);

					if (settings.value.alwaysOnTop === 'When Recording')
						await setAlwaysOnTop(false);
					return Ok(undefined);
				};

				const startRecording = async () => {
					if (settings.value.alwaysOnTop === 'When Recording') {
						await setAlwaysOnTop(true);
					}
					const startRecordingResult = await mediaRecorder.startRecording();
					if (!startRecordingResult.ok) return startRecordingResult;
					recorderState.value = 'RECORDING';
					console.info('Recording started');
					const playSoundResult = await playSound('start');
					if (!playSoundResult.ok) return playSoundResult;
					await notify({
						id: IS_RECORDING_NOTIFICATION_ID,
						title: 'Whispering is recording...',
						description: 'Click to go to recorder',
						action: {
							type: 'link',
							label: 'Go to recorder',
							goto: '/',
						},
					});
					return Ok(undefined);
				};

				return mediaRecorder.recordingState === 'RECORDING'
					? stopRecording()
					: startRecording();
			};

			const toggleRecordingResult = await toggleRecording();
			if (toggleRecordingResult.ok) return;

			recorderState.value = 'IDLE';
			if (settings.value.alwaysOnTop === 'When Recording') {
				await setAlwaysOnTop(false);
			}
			renderErrAsToast(toggleRecordingResult);
		},
		async cancelRecording() {
			const cancelRecordingResult = await mediaRecorder.cancelRecording();
			if (!cancelRecordingResult.ok) return cancelRecordingResult;
			const playSoundResult = await playSound('cancel');
			if (!playSoundResult.ok) return playSoundResult;
			console.info('Recording cancelled');
			recorderState.value = 'IDLE';
			if (settings.value.alwaysOnTop === 'When Recording') {
				await setAlwaysOnTop(false);
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
