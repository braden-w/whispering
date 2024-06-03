import { Data, Effect } from 'effect';

export class InvokeCommandError extends Data.TaggedError('InvokeCommandError')<{
	message: string;
	origError?: unknown;
}> {}

type MessageToBackgroundRequest = {
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

const commands = [
	'getSettings',
	// 'getWhisperingLocalStorage',
	// 'getWhisperingTabId',
	'toggleRecording',
	'openOptionsPage',
	'getCurrentTabId',
	'getRecorderState',
	'setRecorderState',
] as const;
type Command = (typeof commands)[number];

type CommandToImplementations = Record<
	Command,
	Partial<{
		fromBackground: () => Effect.Effect<any, InvokeCommandError>;
		fromPopup: () => Effect.Effect<any, InvokeCommandError>;
		fromContent: () => Effect.Effect<any, InvokeCommandError>;
	}>
>;

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
export const invokeCommand = {
	getCurrentTabId: {
		// Runs on background
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
	openOptionsPage: {
		// Runs on background
		fromBackground: () =>
			Effect.tryPromise({
				try: () => chrome.runtime.openOptionsPage(),
				catch: (e) =>
					new InvokeCommandError({ message: 'Error opening options page', origError: e }),
			}),
		fromPopup: () => Effect.sync(() => {}),
	},
	toggleRecording: {
		// Runs on content
		fromContent: () => Effect.sync(() => {}),
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
		fromPopup: () => Effect.sync(() => {}),
	},
	getSettings: {
		// Runs on content on localhost:5173 or whispering.bradenwong.com
		fromContent: () => Effect.sync(() => {}),
		fromPopup: () => Effect.sync(() => {}),
		fromBackground: () => Effect.sync(() => {}),
	},
} as const satisfies CommandToImplementations;
