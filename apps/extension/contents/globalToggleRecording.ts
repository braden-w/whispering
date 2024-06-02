// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import stopSoundSrc from 'data-base64:~assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from 'data-base64:~assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from 'data-base64:~assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import type { PlasmoCSConfig } from 'plasmo';
import { RecorderStateService } from '~lib/storage/RecorderState';
import { RecorderStateLive } from '~lib/storage/RecorderStateLive';
import { SettingsService } from '~lib/storage/Settings';
import { SettingsLive } from '~lib/storage/SettingsLive';
import { sendMessageToBackground, type MessageToContentScriptRequest } from '~lib/utils/messaging';
import { RecorderServiceLiveWeb } from '../../../packages/services/src/implementations/recorder';
import { RecorderService } from '../../../packages/services/src/services/recorder';
import type { Recording } from '../../../packages/services/src/services/recordings-db';
import { AppStorageFromContentScriptLive } from '~lib/storage/AppStorageLive';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export const config: PlasmoCSConfig = {
	matches: ['http://localhost:5173/*'],
	// matches: ['<all_urls>'],
	// exclude_matches: CHATGPT_DOMAINS,
};

chrome.runtime.onMessage.addListener((message: MessageToContentScriptRequest) =>
	Effect.gen(function* () {
		console.log('🚀 ~ message:', message);
		if (message.action === 'toggle-recording') {
			const recorderService = yield* RecorderService;
			const recorderStateService = yield* RecorderStateService;
			const settingsService = yield* SettingsService;
			const settings = yield* settingsService.get();
			if (!settings.apiKey) {
				alert('Please set your API key in the extension options');
				openOptionsPage();
				return;
			}
			const checkAndUpdateSelectedAudioInputDevice = Effect.gen(function* () {
				const recordingDevices = yield* recorderService.enumerateRecordingDevices;
				const isSelectedDeviceExists = recordingDevices.some(
					({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
				);
				if (!isSelectedDeviceExists) {
					// toast.info('Default audio input device not found, selecting first available device');
					const firstAudioInput = recordingDevices[0].deviceId;
					const settings = yield* settingsService.get();
					yield* settingsService.set({
						...settings,
						selectedAudioInputDeviceId: firstAudioInput,
					});
				}
			}).pipe(
				Effect.catchAll((error) => {
					// toast.error(error.message);
					return Effect.succeed(undefined);
				}),
			);
			yield* checkAndUpdateSelectedAudioInputDevice;
			const recorderState = yield* recorderStateService.get();
			switch (recorderState) {
				case 'IDLE': {
					yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
					if (settings.isPlaySoundEnabled) startSound.play();
					sendMessageToBackground({ action: 'setIcon', icon: 'redLargeSquare' });
					yield* Effect.logInfo('Recording started');
					yield* recorderStateService.set('RECORDING');
					break;
				}
				case 'RECORDING': {
					const audioBlob = yield* recorderService.stopRecording;
					if (settings.isPlaySoundEnabled) stopSound.play();
					sendMessageToBackground({ action: 'setIcon', icon: 'studioMicrophone' });
					yield* Effect.logInfo('Recording stopped');
					const newRecording: Recording = {
						id: nanoid(),
						title: '',
						subtitle: '',
						timestamp: new Date().toISOString(),
						transcribedText: '',
						blob: audioBlob,
						transcriptionStatus: 'UNPROCESSED',
					};
					yield* recorderStateService.set('IDLE');
					// yield* recordings.addRecording(newRecording);
					// recordings.transcribeRecording(newRecording.id);
					break;
				}
			}
		}
	}).pipe(
		Effect.provide(SettingsLive),
		Effect.provide(AppStorageFromContentScriptLive),
		Effect.provide(RecorderStateLive),
		Effect.provide(RecorderServiceLiveWeb),
		Effect.catchAll((error) => {
			console.error('🚀 ~ error:', error);
			// toast.error(error.message);
			return Effect.succeed(undefined);
		}),
		Effect.runPromise,
	),
);

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
