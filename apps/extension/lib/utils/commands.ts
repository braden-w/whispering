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
	[NativeContext in Context as NativeContext extends NativeContext
		? `${NativeRunPrefix}${NativeContext}`
		: never]: (...args: any[]) => Effect.Effect<any, any>;
} & {
	/**
	 * The optional functions to invoke the command from other contexts via
	 * `invokeFrom[OtherContext]`.
	 */
	[OtherContext in Context as OtherContext extends NativeContext
		? never
		: `${RemoteInvocationPrefix}${OtherContext}`]?: (...args: any[]) => Effect.Effect<any, any>;
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

/**
 * Sends a message to a content script running in a specific tab.
 *
 * @param {number} tabId - The ID of the tab where the content script is running.
 * @param {MessageToContentScriptRequest} message - The message to send.
 * @returns {Effect.Effect<any, any>} - An effect representing the message sending operation.
 */
const sendMessageToContentScript = <R>(tabId: number, message: MessageToContentScriptRequest) =>
	Effect.promise(() => chrome.tabs.sendMessage<MessageToContentScriptRequest, R>(tabId, message));

/**
 * Sends a message to the shared background script.
 *
 * @param {MessageToBackgroundRequest} message - The message to send.
 * @returns {Effect.Effect<any, any>} - An effect representing the message sending operation.
 */
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

/**
 * Represents a message to be sent to the background script.
 *
 * @typedef {Object} MessageToBackgroundRequest
 * @property {'openOptionsPage'} action - The action to perform.
 */
export type MessageToBackgroundRequest = {
	action: 'openOptionsPage';
};

/**
 * Represents a message to be sent to a content script.
 *
 * @typedef {Object} MessageToContentScriptRequest
 * @property {'toggleRecording'} action - The action to toggle recording.
 * @property {string} [key] - The key for getLocalStorage action.
 * @property {'getSettingsFromWhisperingLocalStorage'} action - The action to get settings from whispering local storage.
 * @property {'registerListener'} action - The action to register a listener.
 * @property {(event: StorageEvent) => void} [callback] - The callback for registerListener action.
 * @property {string} [value] - The value for setLocalStorage action.
 */
export type MessageToContentScriptRequest =
	| {
			action: 'toggleRecording';
	  }
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
