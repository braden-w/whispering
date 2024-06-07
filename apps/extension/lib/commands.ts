import { Console, Effect } from 'effect';
import type { globalContentScriptCommands } from '~contents/global';
import type { whisperingCommands } from '~contents/whispering';

type AnyFunction = (...args: any[]) => any;
type CommandDefinition = Record<string, AnyFunction>;

export type Message<T extends CommandDefinition> = {
	[K in keyof T]: {
		commandName: K;
		args: Parameters<T[K]>;
	};
}[keyof T];

export type WhisperingMessage = Message<typeof whisperingCommands>;
export type BackgroundServiceWorkerMessage = Message<typeof commands>;
export type GlobalContentScriptMessage = Message<typeof globalContentScriptCommands>;
export type ExtensionMessage =
	| WhisperingMessage
	| BackgroundServiceWorkerMessage
	| GlobalContentScriptMessage;

export const sendMessageToBackground = <Message extends BackgroundServiceWorkerMessage>(
	message: Message,
) =>
	Effect.gen(function* () {
		yield* Console.info('Sending message to background service worker:', message);
		const response = yield* Effect.promise(() => chrome.runtime.sendMessage<Message>(message));
		yield* Console.info('Response from background service worker:', response);
		return response;
	});

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
