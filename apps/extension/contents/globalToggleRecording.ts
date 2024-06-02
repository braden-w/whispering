import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';

// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import stopSoundSrc from 'data-base64:~assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from 'data-base64:~assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from 'data-base64:~assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import { Effect } from 'effect';
import { nanoid } from 'nanoid';
import type { PlasmoCSConfig } from 'plasmo';
import { z } from 'zod';
import { AppStorageFromContentScriptLive } from '~lib/storage/AppStorageLive';
import { ExtensionStorageService } from '~lib/storage/ExtensionStorage';
import { RecorderStateService } from '~lib/storage/RecorderState';
import { RecorderStateLive } from '~lib/storage/RecorderStateLive';
import { sendMessageToBackground, type MessageToContentScriptRequest } from '~lib/utils/messaging';
import {
	APP_STORAGE_KEYS,
	AppStorageService,
} from '../../../packages/services/src/services/app-storage';
import { RecorderService } from '../../../packages/services/src/services/recorder';
import type { Recording } from '../../../packages/services/src/services/recordings-db';
import { RegisterShortcutsService } from '../../../packages/services/src/services/register-shortcuts';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	// exclude_matches: CHATGPT_DOMAINS,
};

chrome.runtime.onMessage.addListener(async function (message: MessageToContentScriptRequest) {
	if (message.action === 'toggle-recording') {
		Effect.gen(function* () {
			const registerShortcutsService = yield* RegisterShortcutsService;
			const recorderService = yield* RecorderService;
			const recorderStateService = yield* RecorderStateService;
			const appStorageService = yield* AppStorageService;
			const extensionStorageService = yield* ExtensionStorageService;
			const settings = yield* appStorageService.get({
				key: 'whispering-settings',
				schema: z.object({
					isPlaySoundEnabled: z.boolean(),
					isCopyToClipboardEnabled: z.boolean(),
					isPasteContentsOnSuccessEnabled: z.boolean(),
					selectedAudioInputDeviceId: z.string(),
					currentLocalShortcut: z.string(),
					currentGlobalShortcut: z.string(),
					apiKey: z.string(),
					outputLanguage: z.string(),
				}),
				defaultValue: {
					isPlaySoundEnabled: true,
					isCopyToClipboardEnabled: true,
					isPasteContentsOnSuccessEnabled: true,
					selectedAudioInputDeviceId: '',
					currentLocalShortcut: registerShortcutsService.defaultLocalShortcut,
					currentGlobalShortcut: registerShortcutsService.defaultGlobalShortcut,
					apiKey: '',
					outputLanguage: 'en',
				},
			});
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
					yield* appStorageService.set({
						key: APP_STORAGE_KEYS.selectedAudioInputDeviceId,
						value: firstAudioInput,
					});
				}
			}).pipe(
				Effect.catchAll((error) => {
					// toast.error(error.message);
					return Effect.succeed(undefined);
				}),
			);

			yield* checkAndUpdateSelectedAudioInputDevice;
			const recorderState = yield* extensionStorageService.get({
				key: 'whispering-recorder-state',
				schema: z.enum(['IDLE', 'RECORDING']),
				defaultValue: 'IDLE',
			});
			switch (recorderState) {
				case 'IDLE': {
					yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
					if (settings.isPlaySoundEnabled) startSound.play();
					chrome.action.setIcon({ path: redLargeSquare });
					yield* Effect.logInfo('Recording started');
					recorderStateService.set('RECORDING');
					break;
				}
				case 'RECORDING': {
					const audioBlob = yield* recorderService.stopRecording;
					if (settings.isPlaySoundEnabled) stopSound.play();
					chrome.action.setIcon({ path: studioMicrophone });
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
					recorderStateService.set('IDLE');
					// yield* recordings.addRecording(newRecording);
					// recordings.transcribeRecording(newRecording.id);
					break;
				}
			}
		}).pipe(
			Effect.provide(AppStorageFromContentScriptLive),
			Effect.provide(RecorderStateLive),
			Effect.catchAll((error) => {
				// toast.error(error.message);
				return Effect.succeed(undefined);
			}),
			Effect.runPromise,
		);
	}
});

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
