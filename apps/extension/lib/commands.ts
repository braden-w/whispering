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
export type GlobalContentScriptMessage = Message<typeof globalContentScriptCommands>;
export type ExtensionMessage = WhisperingMessage | GlobalContentScriptMessage;

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
