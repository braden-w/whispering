import { Ok } from '@epicenterhq/result';
import type { PlaySoundService } from './PlaySoundService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export function createPlaySoundServiceDesktop(): PlaySoundService {
	return {
		playSound: async (soundName) => {
			switch (soundName) {
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
		},
	};
}
