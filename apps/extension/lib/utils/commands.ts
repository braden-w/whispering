import { Data, Effect } from 'effect';
import { z } from 'zod';
import type { BackgroundServiceWorkerContext } from '~background';
import type { GlobalContentScriptContext } from '~contents/globalToggleRecording';
import type { PopupContext } from '~popup';
import type { WhisperingContentScriptContext } from '~contents/whispering';

/**
 * Represents the possible contexts where a command can run.
 */
type Context =
	| PopupContext
	| BackgroundServiceWorkerContext
	| GlobalContentScriptContext
	| WhisperingContentScriptContext;

/**
 * In commands, this prefix is used to directly execute the command in the context.
 *
 * For example, a command that natively runs in the context "BackgroundServiceWorker" will have a key like "runInBackgroundServiceWorker".
 */

type DirectExecutionPrefix = 'runIn';

/**
 * In commands, this prefix is used to invoke the command from another context.
 *
 * For example, a command that runs in the context "BackgroundServiceWorker" can be invoked from the context "Popup" using a key like "invokeFromPopup".
 */
type RemoteInvocationPrefix = 'invokeFrom';

type AnyFunction = () => Effect.Effect<any, any>;

/**
 * A command `runsIn` in a specific context, but can be potentially invoked from all other contexts as well through message passing.
 * A command has a `runsIn` property which specifies the context in which it is actually run and discriminated by that context.
 * It also has a `fromContext` property that is its implementation in that context.
 * All other contexts have an optional implementation, except the context that the command `runsIn`.
 *
 * @template C - The context for which the configuration type is generated.
 */
type ContextConfig<C extends Context> = {
	runsIn: C;
} & {
	/**
	 * Dynamically generates the keys for each implementation of the command in all contexts, like `fromPopup`, `fromBackgroundServiceWorker`, etc.
	 * - The function is required if the key matches the context (`C`).
	 * - The function is optional for other contexts.
	 */

	[K in Context as K extends C
		? `${DirectExecutionPrefix}${K}`
		: `${RemoteInvocationPrefix}${K}`]: K extends C ? AnyFunction : AnyFunction | undefined;
};

/**
 * Represents the configuration for a command, discriminated by context.
 *
 * This type automatically generates the discriminated union of command configurations for all contexts.
 */

type CommandConfig = {
	[K in Context]: ContextConfig<K>;
}[Context];

class InvokeCommandError extends Data.TaggedError('InvokeCommandError')<{
	message: string;
	origError?: unknown;
}> {}

const sendMessageToContentScript = <R>(tabId: number, message: MessageToContentScriptRequest) =>
	Effect.promise(() => chrome.tabs.sendMessage<MessageToContentScriptRequest, R>(tabId, message));

/** Sends a message to the shared background script, captured in {@link ~background.ts}. */
export const sendMessageToBackground = <R>(message: MessageToBackgroundRequest) =>
	Effect.promise(() => chrome.runtime.sendMessage<MessageToBackgroundRequest, R>(message));

/**
 * Object containing implementations of various commands.
 *
 * Commands can be accessed via `commands.[commandName].invokeFrom[context]`
 * where `commandName` is the command name, e.g. `getCurrentTabId`,
 * and `context` is one of the designated contexts like `Popup`, `BackgroundServiceWorker`, etc.
 *
 * Example:
 * ```
 * invokeCommand.getCurrentTabId.fromBackgroundServiceWorker();
 * ```
 */

const commands = {
	openOptionsPage: {
		runsIn: 'BackgroundServiceWorker',
		runInBackgroundServiceWorker: () =>
			Effect.tryPromise({
				try: () => chrome.runtime.openOptionsPage(),
				catch: (e) =>
					new InvokeCommandError({ message: 'Error opening options page', origError: e }),
			}),
	},
	getCurrentTabId: {
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
	},
	getSettings: {
		runsIn: 'WhisperingContentScript',
		runInWhisperingContentScript: () =>
			Effect.gen(function* () {
				const appStorageService = yield* AppStorageService;
				const registerShortcutsService = yield* RegisterShortcutsService;
				return appStorageService.get({
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
			}).pipe(Effect.provide(AppStorageLive), Effect.provide(RegisterShortcutsWebLive)),
	},
	// 'getWhisperingLocalStorage',
	// 'getWhisperingTabId',
	toggleRecording: {
		runsIn: 'GlobalContentScript',
		runInGlobalContentScript: () =>
			Effect.gen(function* () {
				const settings = yield* settingsService.get();
				if (!settings.apiKey) {
					alert('Please set your API key in the extension options');
					openOptionsPage();
					return;
				}
				yield* checkAndUpdateSelectedAudioInputDevice();
				const recorderState = yield* recorderStateService.get();
				switch (recorderState) {
					case 'IDLE': {
						yield* recorderService.startRecording(settings.selectedAudioInputDeviceId);
						if (settings.isPlaySoundEnabled) startSound.play();
						sendMessageToBackground({ action: 'syncIconToRecorderState', recorderState });
						yield* Effect.logInfo('Recording started');
						yield* recorderStateService.set('RECORDING');
						break;
					}
					case 'RECORDING': {
						yield* recorderService.stopRecording();
						if (settings.isPlaySoundEnabled) stopSound.play();
						sendMessageToBackground({ action: 'syncIconToRecorderState', recorderState });
						yield* Effect.logInfo('Recording stopped');
						yield* recorderStateService.set('IDLE');
						break;
					}
					default: {
						yield* Effect.logError('Invalid recorder state');
					}
				}
			}),
		invokeFromBackgroundServiceWorker: () =>
			Effect.gen(function* () {
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
						if (!firstActiveTab) {
							return yield* new InvokeCommandError({ message: 'No active tab found' });
						}
						return firstActiveTab.id;
					});
				const activeTabId = yield* getActiveTabId();
				yield* sendMessageToContentScript(activeTabId, {
					action: 'toggleRecording',
				});
			}),
	},
} as const satisfies Record<string, CommandConfig>;

export type MessageToBackgroundRequest = {
	action: 'openOptionsPage';
};

export type MessageToContentScriptRequest =
	| {
			action: 'toggleRecording';
	  }
	// | { action: 'switch-chatgpt-icon'; icon: Icon }
	| {
			action: 'getLocalStorage';
			key: string;
	  }
	| {
			action: 'getSettingsFromWhisperingLocalStorage';
	  }
	| {
			action: 'registerListener';
			callback: (event: StorageEvent) => void;
	  }
	| {
			action: 'setLocalStorage';
			key: string;
			value: string;
	  };
