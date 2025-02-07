import { Ok } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { WhisperingErr } from '@repo/shared';
import type { PlaySoundService } from './PlaySoundService';
import stopSoundSrc from './assets/sound_ex_machina_Button_Blip.mp3';
import startManualSoundSrc from './assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import startVadSoundSrc from './assets/zapsplat_household_alarm_clock_large_snooze_button_press_002_12969.mp3';
import cancelSoundSrc from './assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import transformationCompleteSoundSrc from './assets/zapsplat_multimedia_notification_alert_ping_bright_chime_001_93276.mp3';
import transcriptionCompleteSoundSrc from './assets/zapsplat_multimedia_ui_notification_classic_bell_synth_success_107505.mp3';

const startVadSound = new Audio(startVadSoundSrc);
const startManualSound = new Audio(startManualSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);
const transcriptionCompleteSound = new Audio(transcriptionCompleteSoundSrc);
const transformationCompleteSound = new Audio(transformationCompleteSoundSrc);

export function createPlaySoundServiceWeb(): PlaySoundService {
	return {
		playSound: async (soundName) => {
			if (!document.hidden) {
				switch (soundName) {
					case 'start-vad':
						await startVadSound.play();
						break;
					case 'start-manual':
						await startManualSound.play();
						break;
					case 'stop-manual':
						await stopSound.play();
						break;
					case 'cancel':
						await cancelSound.play();
						break;
					case 'transcriptionComplete':
						await transcriptionCompleteSound.play();
						break;
					case 'transformationComplete':
						await transformationCompleteSound.play();
						break;
				}
				return Ok(undefined);
			}
			const playSoundResult = await extension.playSound({ sound: soundName });
			if (!playSoundResult.ok) {
				return WhisperingErr({
					title: '❌ Failed to Play Sound',
					description: `We encountered an issue while playing the ${soundName} sound`,
					action: {
						type: 'more-details',
						error: playSoundResult.error,
					},
				});
			}
			return Ok(undefined);
		},
	};
}
