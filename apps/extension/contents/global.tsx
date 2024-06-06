import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { RecorderService } from '@/lib/services/RecorderService';
import { RecorderServiceLive } from '@/lib/services/RecorderServiceLive';
import { RecorderStateService } from '@/lib/services/RecorderState';
import { RecorderStateLive } from '@/lib/services/RecorderStateLive';
import stopSoundSrc from 'data-base64:~assets/sound_ex_machina_Button_Blip.mp3';
import startSoundSrc from 'data-base64:~assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import cancelSoundSrc from 'data-base64:~assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import cssText from 'data-text:~/style.css';
import { Console, Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useEffect } from 'react';
import { z } from 'zod';
import {
	sendMessageToBackground,
	sendMessageToWhisperingContentScript,
	type Message,
} from '~lib/commands';
import { extensionStorage } from '~lib/services/ExtensionStorageLive';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};
const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

export const globalContentScriptCommands = {
	toggleRecording: () =>
		Effect.gen(function* () {
			const recorderService = yield* RecorderService;
			const recorderStateService = yield* RecorderStateService;

			const checkAndUpdateSelectedAudioInputDevice = Effect.gen(function* () {
				const settings = yield* sendMessageToWhisperingContentScript({
					commandName: 'getSettings',
					args: [],
				});
				const recordingDevices = yield* recorderService.enumerateRecordingDevices;
				const isSelectedDeviceExists = recordingDevices.some(
					({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
				);
				if (!isSelectedDeviceExists) {
					// toast.info('Default audio input device not found, selecting first available device');
					const firstAudioInput = recordingDevices[0].deviceId;
					const oldSettings = yield* sendMessageToWhisperingContentScript({
						commandName: 'getSettings',
						args: [],
					});
					yield* sendMessageToWhisperingContentScript({
						commandName: 'setSettings',
						args: [
							{
								...oldSettings,
								selectedAudioInputDeviceId: firstAudioInput,
							},
						],
					});
				}
			}).pipe(
				Effect.catchAll((error) => {
					// toast.error(error.message);
					return Effect.succeed(undefined);
				}),
			);

			const currentTab = yield* Effect.promise(() => chrome.tabs.getCurrent());
			const settings = yield* sendMessageToWhisperingContentScript({
				commandName: 'getSettings',
				args: [],
			});
			if (!settings.apiKey) {
				alert('Please set your API key in the extension options');
				yield* sendMessageToBackground({
					commandName: 'openOptionsPage',
					args: [],
				});
				return;
			}
			const recordingTabId = yield* extensionStorage.get({
				key: 'whispering-recording-tab-id',
				schema: z.string(),
				defaultValue: String(currentTab?.id) ?? '',
			});
			if (recordingTabId) {
				yield* Effect.promise(() => chrome.tabs.update(Number(recordingTabId), { active: true }));
				alert('You are already recording in another tab');
				return;
			}
			yield* checkAndUpdateSelectedAudioInputDevice;
			const recorderState = yield* recorderStateService.get();
			switch (recorderState) {
				case 'IDLE': {
					yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
					if (settings.isPlaySoundEnabled) startSound.play();
					// sendMessageToBackground({ command: 'syncIconToRecorderState', recorderState });
					yield* Effect.logInfo('Recording started');
					yield* recorderStateService.set('RECORDING');
					break;
				}
				case 'RECORDING': {
					yield* recorderService.stopRecording();
					if (settings.isPlaySoundEnabled) stopSound.play();
					// sendMessageToBackground({ command: 'syncIconToRecorderState', recorderState });
					yield* Effect.logInfo('Recording stopped');
					yield* recorderStateService.set('IDLE');
					break;
				}
				default: {
					yield* Effect.logError('Invalid recorder state');
				}
			}
		}).pipe(Effect.provide(RecorderServiceLive), Effect.provide(RecorderStateLive)),
	cancelRecording: () =>
		Effect.gen(function* () {
			const recorderService = yield* RecorderService;
			const recorderStateService = yield* RecorderStateService;
			const settings = yield* sendMessageToWhisperingContentScript({
				commandName: 'getSettings',
				args: [],
			});
			const recorderState = yield* recorderStateService.get();
			yield* recorderService.cancelRecording;
			if (recorderState === 'RECORDING' && settings.isPlaySoundEnabled) cancelSound.play();
			yield* Effect.logInfo('Recording cancelled');
			yield* recorderStateService.set('IDLE');
		}).pipe(Effect.provide(RecorderServiceLive), Effect.provide(RecorderStateLive)),
} as const;

export type GlobalContentScriptMessage = Message<typeof globalContentScriptCommands>;

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

const syncRecorderStateWithMediaRecorderStateOnLoad = Effect.gen(function* () {
	const recorderService = yield* RecorderService;
	const recorderStateService = yield* RecorderStateService;
	const initialRecorderState = yield* recorderService.recorderState;
	yield* recorderStateService.set(initialRecorderState);
	yield* Console.info('Synced recorder state with media recorder state on load', {
		initialRecorderState,
	});
}).pipe(Effect.provide(RecorderStateLive), Effect.provide(RecorderServiceLive), Effect.runPromise);

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: GlobalContentScriptMessage, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			const { commandName, args } = message;
			yield* Console.info('Received message in global content script', { commandName, args });
			const correspondingCommand = globalContentScriptCommands[commandName];
			const response = yield* correspondingCommand(...args);
			yield* Console.info(`Responding to invoked command ${commandName} in global content script`, {
				response,
			});
			sendResponse(response);
		});
		program.pipe(Effect.runPromise);
		return true; // Will respond asynchronously.
	},
);

function ErrorToast() {
	const { toast } = useToast();
	useEffect(
		() =>
			Effect.gen(function* () {
				yield* extensionStorage.watch({
					key: 'whispering-toast',
					schema: z.object({
						title: z.string(),
						description: z.string().optional(),
					}),
					callback: (newValue) =>
						toast({
							...newValue,
							variant: 'destructive',
						}),
				});
			}).pipe(Effect.runSync),
		[],
	);
	return <Toaster />;
}

export default ErrorToast;
