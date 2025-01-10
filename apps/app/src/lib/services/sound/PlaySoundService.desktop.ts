import { Ok } from '@epicenterhq/result';
import type { PlaySoundService } from './PlaySoundService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import transcriptionCompleteSoundSrc from './assets/zapsplat_multimedia_ui_notification_classic_bell_synth_success_107505.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);
const transcriptionCompleteSound = new Audio(transcriptionCompleteSoundSrc);

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playStartSound: async () => {
			await startSound.play();
			return Ok(undefined);
		},
		playStopSound: async () => {
			await stopSound.play();
			return Ok(undefined);
		},
		playTranscriptionCompleteSound: async () => {
			await transcriptionCompleteSound.play();
			return Ok(undefined);
		},
		playCancelSound: async () => {
			await cancelSound.play();
			return Ok(undefined);
		},
	};
}
