import { z } from 'zod';
import { Data, Effect } from 'effect';
import { AppStorageService } from '../../../../packages/services/src/services/app-storage';
import { RegisterShortcutsService } from '../../../../packages/services/src/services/register-shortcuts';

class InvokeCommandError extends Data.TaggedError('InvokeCommandError')<{
	message: string;
	origError?: unknown;
}> {}

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

const sendMessageToContentScript = <R>(tabId: number, message: MessageToContentScriptRequest) =>
	Effect.promise(() => chrome.tabs.sendMessage<MessageToContentScriptRequest, R>(tabId, message));

/** Sends a message to the shared background script, captured in {@link ~background.ts}. */
export const sendMessageToBackground = <R>(message: MessageToBackgroundRequest) => {
	chrome.runtime.sendMessage<MessageToBackgroundRequest, R>(message);
};

type CommandToImplementations = Record<string, CommandConfig>;

type CommandConfig = Partial<{
	fromBackground: () => Effect.Effect<any, any>;
	fromPopup: () => Effect.Effect<any, any>;
	fromContent: () => Effect.Effect<any, any>;
}>;
/**
 * Object containing implementations of various commands.
 *
 * Commands can be accessed via `invokeCommand.[command].[fromContext]`
 * where `command` is the command name, e.g. `getCurrentTabId`,
 * and `fromContext` is one of 'fromBackground', 'fromPopup', 'fromContent'
 * and refers to the context in which the command is being invoked.
 *
 * Example:
 * ```
 * invokeCommand.getCurrentTabId.fromBackground();
 * ```
 */
const invokeBackgroundAction = {
	openOptionsPage: {
		fromBackground: () =>
			Effect.tryPromise({
				try: () => chrome.runtime.openOptionsPage(),
				catch: (e) =>
					new InvokeCommandError({ message: 'Error opening options page', origError: e }),
			}),
	},
	getCurrentTabId: {
		fromBackground: () =>
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
} as const satisfies CommandToImplementations;

const invokeContentAction = {
	getSettings: {
		fromContent: () =>
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
		fromBackground: () =>
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
} as const satisfies CommandToImplementations;
