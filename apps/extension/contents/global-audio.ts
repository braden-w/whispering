import stopSoundSrc from 'data-base64:~/assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from 'data-base64:~/assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from 'data-base64:~/assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.message === 'playSound') {
		switch (message.sound) {
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
	}
});
