import { Data, Effect, Option } from 'effect';
import type { BackgroundServiceWorkerMessage, backgroundServiceWorkerCommands } from '~background';
import type { GlobalContentScriptMessage, globalContentScriptCommands } from '~contents/global';
import type { WhisperingMessage, whisperingCommands } from '~contents/whispering';

type AnyFunction = (...args: any[]) => any;
type CommandDefinition = Record<string, AnyFunction>;

export type Message<T extends CommandDefinition> = {
	[K in keyof T]: {
		commandName: K;
		args: Parameters<T[K]>;
	};
}[keyof T];

/**
 * Error thrown when an invocation of a command fails.
 */
class InvokeCommandError extends Data.TaggedError('InvokeCommandError')<{
	message: string;
	origError?: unknown;
}> {}

export const sendMessageToWhisperingContentScript = <Message extends WhisperingMessage>(
	message: Message,
) =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTabId;
		return yield* Effect.promise(() =>
			chrome.tabs.sendMessage<
				Message,
				Effect.Effect.Success<ReturnType<(typeof whisperingCommands)[Message['commandName']]>>
			>(whisperingTabId, message),
		);
	});

export const sendMessageToGlobalContentScript = <Message extends GlobalContentScriptMessage>(
	message: Message,
) =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId();
		return yield* Effect.promise(() =>
			chrome.tabs.sendMessage<
				Message,
				Effect.Effect.Success<
					ReturnType<(typeof globalContentScriptCommands)[Message['commandName']]>
				>
			>(activeTabId, message),
		);
	});

export const sendMessageToBackground = <Message extends BackgroundServiceWorkerMessage>(
	message: Message,
) =>
	Effect.promise(() =>
		chrome.runtime.sendMessage<
			Message,
			Effect.Effect.Success<
				ReturnType<(typeof backgroundServiceWorkerCommands)[Message['commandName']]>
			>
		>(message),
	);

// const sendErrorToast = {
// 	runInGlobalContentScript: (toast) =>
// 		Effect.gen(function* () {
// 			const extensionStorage = yield* ExtensionStorageService;
// 			yield* extensionStorage.set({
// 				key: 'whispering-toast',
// 				value: toast,
// 			});
// 			// toast.error(message);
// 		}).pipe(Effect.provide(ExtensionStorageLive)),
// } as const satisfies Commands['sendErrorToast'];

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
}).pipe(
	Effect.flatMap(Option.fromNullable),
	Effect.mapError(
		() => new InvokeCommandError({ message: 'Error getting or creating Whispering tab' }),
	),
);

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
