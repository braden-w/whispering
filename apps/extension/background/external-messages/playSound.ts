import { Console, Effect } from 'effect';
import stopSoundSrc from '/assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from '/assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from '/assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

const handler = (sound: 'start' | 'stop' | 'cancel') =>
	Effect.gen(function* () {
		yield* Console.info('Playing sound', sound);
		switch (sound) {
			case 'start':
				startSound.play();
				break;
			case 'stop':
				stopSound.play();
				break;
			case 'cancel':
				cancelSound.play();
				break;
		}
		return true;
	});

export default handler;
