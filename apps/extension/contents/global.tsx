import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
// import stopSoundSrc from 'data-base64:~assets/sound_ex_machina_Button_Blip.mp3';
// import startSoundSrc from 'data-base64:~assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
// import cancelSoundSrc from 'data-base64:~assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';
import cssText from 'data-text:~/style.css';
import { Console, Effect } from 'effect';
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo';
import { useEffect } from 'react';
import { sendToBgsw } from '~lib/commands';
import type * as GetActiveTabId from '~background/messages/getActiveTabId';
import type * as GetSettings from '~background/messages/getSettings';
import type * as OpenOptionsPage from '~background/messages/openOptionsPage';
import type * as GoToTabId from '~background/messages/goToTabId';
import type * as SetSettings from '~background/messages/setSettings';
import { type ExtensionMessage, type Message } from '~lib/commands';
import { extensionStorage, sendErrorToastViaStorage } from '~lib/services/extension-storage';
import { recorderService } from '~lib/services/recorder';
import { recorderStateService } from '~lib/services/recorderStateService';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	all_frames: true,
};
// const startSound = new Audio(startSoundSrc);
// const stopSound = new Audio(stopSoundSrc);
// const cancelSound = new Audio(cancelSoundSrc);

export const globalContentScriptCommands = {
	toggleRecording: () =>
		Effect.gen(function* () {
			const checkAndUpdateSelectedAudioInputDevice = Effect.gen(function* () {
				const settings = yield* sendToBgsw<GetSettings.RequestBody, GetSettings.ResponseBody>({
					name: 'getSettings',
				});
				const recordingDevices = yield* recorderService.enumerateRecordingDevices();
				const isSelectedDeviceExists = recordingDevices.some(
					({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
				);
				if (!isSelectedDeviceExists) {
					// toast.info('Default audio input device not found, selecting first available device');
					const firstAudioInput = recordingDevices[0].deviceId;
					const oldSettings = yield* sendToBgsw<GetSettings.RequestBody, GetSettings.ResponseBody>({
						name: 'getSettings',
					});
					yield* sendToBgsw<SetSettings.RequestBody, SetSettings.ResponseBody>({
						name: 'setSettings',
						body: {
							settings: {
								...oldSettings,
								selectedAudioInputDeviceId: firstAudioInput,
							},
						},
					});
				}
			}).pipe(
				Effect.catchAll((error) =>
					Effect.gen(function* () {
						yield* sendErrorToastViaStorage(error);
					}),
				),
			);
			const settings = yield* sendToBgsw<GetSettings.RequestBody, GetSettings.ResponseBody>({
				name: 'getSettings',
			});
			if (!settings.apiKey) {
				alert('Please set your API key in the extension options');
				yield* sendToBgsw<OpenOptionsPage.RequestBody, OpenOptionsPage.ResponseBody>({
					name: 'openOptionsPage',
				});
				return;
			}
			const activeTabId = yield* sendToBgsw<
				GetActiveTabId.RequestBody,
				GetActiveTabId.ResponseBody
			>({ name: 'getActiveTabId' });
			const recordingTabId = yield* extensionStorage.get({
				key: 'whispering-recording-tab-id',
				defaultValue: activeTabId,
			});
			if (activeTabId !== recordingTabId) {
				yield* sendToBgsw<GoToTabId.RequestBody, GoToTabId.ResponseBody>({
					name: 'goToTabId',
					body: { tabId: Number(recordingTabId) },
				});
				alert('Please stop the recording in the current tab before starting a new one');
				return;
			}
			yield* checkAndUpdateSelectedAudioInputDevice;
			const recorderState = yield* recorderStateService.get();
			switch (recorderState) {
				case 'IDLE': {
					yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
					// if (settings.isPlaySoundEnabled) startSound.play();
					yield* Effect.logInfo('Recording started');
					yield* recorderStateService.set('RECORDING');
					break;
				}
				case 'RECORDING': {
					yield* recorderService.stopRecording();
					// if (settings.isPlaySoundEnabled) stopSound.play();
					yield* Effect.logInfo('Recording stopped');
					yield* recorderStateService.set('IDLE');
					break;
				}
				default: {
					yield* Effect.logError('Invalid recorder state');
				}
			}
		}).pipe(
			Effect.catchAll((error) =>
				Effect.gen(function* () {
					yield* sendErrorToastViaStorage(error);
				}),
			),
		),
	cancelRecording: () =>
		Effect.gen(function* () {
			const settings = yield* sendToBgsw<GetSettings.RequestBody, GetSettings.ResponseBody>({
				name: 'getSettings',
			});
			const recorderState = yield* recorderStateService.get();
			recorderService.cancelRecording();
			// if (recorderState === 'RECORDING' && settings.isPlaySoundEnabled) cancelSound.play();
			yield* Effect.logInfo('Recording cancelled');
			yield* recorderStateService.set('IDLE');
		}),
} as const;

export type GlobalContentScriptMessage = Message<typeof globalContentScriptCommands>;

export const getStyle: PlasmoGetStyle = () => {
	const style = document.createElement('style');
	style.textContent = cssText;
	return style;
};

const syncRecorderStateWithMediaRecorderStateOnLoad = Effect.gen(function* () {
	const initialRecorderState = recorderService.recorderState;
	yield* recorderStateService.set(initialRecorderState);
	yield* Console.info('Synced recorder state with media recorder state on load', {
		initialRecorderState,
	});
}).pipe(Effect.runPromise);

const isGlobalContentScriptMessage = (
	message: ExtensionMessage,
): message is GlobalContentScriptMessage => message.commandName in globalContentScriptCommands;

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: ExtensionMessage, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			if (!isGlobalContentScriptMessage(message)) return false;
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
					callback: (newValue) => toast(newValue),
				});
			}).pipe(Effect.runSync),
		[],
	);
	return <Toaster />;
}

export default ErrorToast;
