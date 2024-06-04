import { Data, Effect } from 'effect';
import { z } from 'zod';
import { RecorderService } from './RecorderService';
import { RecorderServiceLive } from './RecorderServiceLive';
import { RecorderStateService } from '~lib/storage/RecorderState';
import { RecorderStateLive } from '~lib/storage/RecorderStateLive';
import type { BackgroundServiceWorkerContext } from '~background';
import type { GlobalContentScriptContext } from '~contents/globalToggleRecording';
import type { PopupContext } from '~popup';
import type { WhisperingContentScriptContext } from '~contents/whispering';

import startSoundSrc from 'data-base64:~assets/zapsplat_household_alarm_clock_button_press_12967.mp3';
import stopSoundSrc from 'data-base64:~assets/sound_ex_machina_Button_Blip.mp3';
import cancelSoundSrc from 'data-base64:~assets/zapsplat_multimedia_click_button_short_sharp_73510.mp3';

const startSound = new Audio(startSoundSrc);
const stopSound = new Audio(stopSoundSrc);
const cancelSound = new Audio(cancelSoundSrc);

/**
 * One popup, one background service worker, and one or many content scripts.
 * 
 * Represents the possible contexts where a command can run.
 */
type Context =
	| PopupContext
	| BackgroundServiceWorkerContext
	| GlobalContentScriptContext
	| WhisperingContentScriptContext;

/**
 * Prefix used to name the method that directly executes the command in its
 * native context.
 *
 * For example, a command that runs in the context "BackgroundServiceWorker"
 * can be directly executed in the background service worker by calling
 * the method "runInBackgroundServiceWorker".
 */
type NativeRunPrefix = 'runIn';

/**
 * Prefix used to name the method invokes the command from another context.
 *
 * For example, a command that runs in the context "BackgroundServiceWorker"
 * can be invoked from the context "Popup" the method "invokeFromPopup".
 */
type RemoteInvocationPrefix = 'invokeFrom';

/**
 * Represents the configuration for a command.
 *
 * This configuration includes:
 * - `runsIn`: Specifies the native context where the command runs.
 * - `runIn[C]`: A function to directly execute the command within its native context `C`.
 * - `invokeFrom[C]`: An optional function to invoke the command from another context `C`.
 *
 * @template NativeContext - The context where the command natively runs.
 */
type ContextConfig<NativeContext extends Context> = {
	/**
	 * The native context where the command runs and is discriminated by.
	 */
	runsIn: NativeContext;
} & {
	/**
	 * The function to directly execute the command within its native context
	 * via `runIn[NativeContext]`.
	 */
	[ExecuteContext in Context as ExecuteContext extends NativeContext
		? `${NativeRunPrefix}${ExecuteContext}`
		: never]: (...args: any[]) => Effect.Effect<any, any> | Effect.Effect<any, any>;
} & {
	/**
	 * The optional functions to invoke the command from other contexts via
	 * `invokeFrom[OtherContext]`.
	 */
	[OtherContext in Context as OtherContext extends NativeContext
		? never
		: `${RemoteInvocationPrefix}${OtherContext}`]?: (
		...args: any[]
	) => Effect.Effect<any, any> | Effect.Effect<any, any>;
};

/**
 * Represents the configuration for a command, discriminated by context.
 * This type automatically generates the discriminated union of command configurations for all contexts.
 */
type CommandConfig = {
	[K in Context]: ContextConfig<K>;
}[Context];

/**
 * Error thrown when an invocation of a command fails.
 */
class InvokeCommandError extends Data.TaggedError('InvokeCommandError')<{
	message: string;
	origError?: unknown;
}> {}

const sendMessageToContentScript = <R>(tabId: number, message: MessageToContentScriptRequest) =>
	Effect.promise(() => chrome.tabs.sendMessage<MessageToContentScriptRequest, R>(tabId, message));

export const sendMessageToBackground = <R>(message: MessageToBackgroundRequest) =>
	Effect.promise(() => chrome.runtime.sendMessage<MessageToBackgroundRequest, R>(message));

const commandNames = [
	'openOptionsPage',
	'getCurrentTabId',
	'getSettings',
	'toggleRecording',
	'cancelRecording',
] as const;
type CommandName = (typeof commandNames)[number];

// --- Begin commands ---

const openOptionsPage = {
	runsIn: 'BackgroundServiceWorker',
	runInBackgroundServiceWorker: () =>
		Effect.tryPromise({
			try: () => chrome.runtime.openOptionsPage(),
			catch: (e) => new InvokeCommandError({ message: 'Error opening options page', origError: e }),
		}),
	invokeFromGlobalContentScript: () =>
		Effect.gen(function* () {
			yield* sendMessageToBackground<void>({ command: 'openOptionsPage' });
		}),
} as const satisfies CommandConfig;

const getCurrentTabId = {
	runsIn: 'BackgroundServiceWorker',
	runInBackgroundServiceWorker: () =>
		Effect.gen(function* () {
			const activeTabs = yield* Effect.tryPromise({
				try: () => chrome.tabs.query({ active: true, currentWindow: true }),
				catch: (error) =>
					new InvokeCommandError({
						message: 'Error getting active tabs',
						origError: error,
					}),
			});
			const firstActiveTab = activeTabs[0];
			if (!firstActiveTab) {
				return yield* new InvokeCommandError({ message: 'No active tab found' });
			}
			return firstActiveTab.id;
		}),
} as const satisfies CommandConfig;

const settingsSchema = z.object({
	isPlaySoundEnabled: z.boolean(),
	isCopyToClipboardEnabled: z.boolean(),
	isPasteContentsOnSuccessEnabled: z.boolean(),
	selectedAudioInputDeviceId: z.string(),
	currentLocalShortcut: z.string(),
	currentGlobalShortcut: z.string(),
	apiKey: z.string(),
	outputLanguage: z.string(),
});
type Settings = z.infer<typeof settingsSchema>;

const getSettings = {
	runsIn: 'WhisperingContentScript',
	runInWhisperingContentScript: () =>
		getLocalStorage({
			key: 'whispering-settings',
			schema: settingsSchema,
			defaultValue: {
				isPlaySoundEnabled: true,
				isCopyToClipboardEnabled: true,
				isPasteContentsOnSuccessEnabled: true,
				selectedAudioInputDeviceId: '',
				currentLocalShortcut: 'space',
				currentGlobalShortcut: '',
				apiKey: '',
				outputLanguage: 'en',
			},
		}),
	invokeFromGlobalContentScript: () =>
		Effect.gen(function* () {
			const whisperingTabId = yield* getOrCreateWhisperingTabId;
			return yield* sendMessageToContentScript<Settings>(whisperingTabId, {
				command: 'getSettings',
			});
		}),
} as const satisfies CommandConfig;

const setSettings = {
	runsIn: 'WhisperingContentScript',
	runInWhisperingContentScript: (settings: Settings) =>
		setLocalStorage({
			key: 'whispering-settings',
			value: JSON.stringify(settings),
		}),
	invokeFromGlobalContentScript: (settings: Settings) =>
		Effect.gen(function* () {
			const whisperingTabId = yield* getOrCreateWhisperingTabId;
			return yield* sendMessageToContentScript<void>(whisperingTabId, {
				command: 'setSettings',
				settings,
			});
		}),
} as const satisfies CommandConfig;

const toggleRecording = {
	runsIn: 'GlobalContentScript',
	runInGlobalContentScript: () =>
		Effect.gen(function* () {
			const checkAndUpdateSelectedAudioInputDevice = () =>
				Effect.gen(function* () {
					const settings = yield* getSettings.invokeFromGlobalContentScript();
					const recordingDevices = yield* recorderService.enumerateRecordingDevices;
					const isSelectedDeviceExists = recordingDevices.some(
						({ deviceId }) => deviceId === settings.selectedAudioInputDeviceId,
					);
					if (!isSelectedDeviceExists) {
						// toast.info('Default audio input device not found, selecting first available device');
						const firstAudioInput = recordingDevices[0].deviceId;
						const oldSettings = yield* getSettings.invokeFromGlobalContentScript();
						yield* setSettings.invokeFromGlobalContentScript({
							...oldSettings,
							selectedAudioInputDeviceId: firstAudioInput,
						});
					}
				}).pipe(
					Effect.catchAll((error) => {
						// toast.error(error.message);
						return Effect.succeed(undefined);
					}),
				);
			const recorderService = yield* RecorderService;
			const recorderStateService = yield* RecorderStateService;
			const settings = { apiKey: '', selectedAudioInputDeviceId: '', isPlaySoundEnabled: true };
			if (!settings.apiKey) {
				alert('Please set your API key in the extension options');
				yield* openOptionsPage.invokeFromGlobalContentScript();
				return;
			}
			yield* checkAndUpdateSelectedAudioInputDevice();
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
	invokeFromBackgroundServiceWorker: () =>
		Effect.gen(function* () {
			const activeTabId = yield* getActiveTabId();
			yield* sendMessageToContentScript(activeTabId, {
				command: 'toggleRecording',
			});
		}),
	invokeFromPopup: () =>
		Effect.gen(function* () {
			const activeTabId = yield* getActiveTabId();
			yield* sendMessageToContentScript(activeTabId, {
				command: 'toggleRecording',
			});
		}),
} as const satisfies CommandConfig;

/**
 * Object containing implementations of various commands.
 *
 * Commands can be accessed via `commands.[commandName].invokeFrom[context]`
 * where `commandName` is the command name, e.g. `getCurrentTabId`,
 * and `context` is one of the designated contexts like `Popup`, `BackgroundServiceWorker`, etc.
 *
 * Example:
 * ```
 * commands.getCurrentTabId.invokeFromBackgroundServiceWorker();
 * ```
 */
export const commands = {
	getCurrentTabId,
	getSettings,
	openOptionsPage,
	toggleRecording,
} as const satisfies Record<CommandName, CommandConfig>;

type MessageToContentScriptRequest = {
	[K in CommandName]: {
		command: K;
	}; // & Parameters<(typeof commands)[K][`runIn${(typeof commands)[K]['runsIn']}`]>[0];
}[CommandName];

type MessageToBackgroundRequest = {
	[K in CommandName]: {
		command: K;
	}; // & Parameters<(typeof commands)[K][`runIn${(typeof commands)[K]['runsIn']}`]>[0];
}[CommandName];

const getLocalStorage = <TSchema extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue,
}: {
	key: string;
	schema: TSchema;
	defaultValue: z.infer<TSchema>;
}) =>
	Effect.try({
		try: () => {
			const valueFromStorage = localStorage.getItem(key);
			const isEmpty = valueFromStorage === null;
			if (isEmpty) return defaultValue;
			return schema.parse(JSON.parse(valueFromStorage)) as z.infer<TSchema>;
		},
		catch: (error) =>
			new InvokeCommandError({
				message: `Error getting from local storage for key: ${key}`,
				origError: error,
			}),
	}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue)));

const setLocalStorage = ({ key, value }: { key: string; value: any }) =>
	Effect.try({
		try: () => localStorage.setItem(key, value),
		catch: (error) =>
			new InvokeCommandError({
				message: `Error setting in local storage for key: ${key}`,
				origError: error,
			}),
	});

const getOrCreateWhisperingTabId = Effect.gen(function* (_) {
	const tabs = yield* Effect.promise(() => chrome.tabs.query({ url: 'http://localhost:5173/*' }));
	if (tabs.length > 0) {
		for (const tab of tabs) {
			if (tab.pinned) {
				return tab.id;
			}
		}
		return tabs[0].id;
	} else {
		const newTab = yield* Effect.promise(() =>
			chrome.tabs.create({
				url: 'http://localhost:5173',
				active: false,
				pinned: true,
			}),
		);
		return newTab.id;
	}
});

const getActiveTabId = () =>
	Effect.gen(function* () {
		const activeTabs = yield* Effect.tryPromise({
			try: () => chrome.tabs.query({ active: true, currentWindow: true }),
			catch: (error) =>
				new InvokeCommandError({
					message: 'Error getting active tabs',
					origError: error,
				}),
		});
		const firstActiveTab = activeTabs[0];
		if (!firstActiveTab.id) {
			return yield* new InvokeCommandError({ message: 'No active tab ID found' });
		}
		return firstActiveTab.id;
	});
