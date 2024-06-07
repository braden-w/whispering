import type { GlobalContentScriptMessage } from '~contents/global';
import type { WhisperingMessage } from '~contents/whispering';

type AnyFunction = (...args: any[]) => any;
type CommandDefinition = Record<string, AnyFunction>;

export type Message<T extends CommandDefinition> = {
	[K in keyof T]: {
		commandName: K;
		args: Parameters<T[K]>;
	};
}[keyof T];

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
