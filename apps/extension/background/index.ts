import { sendToBackground } from '@plasmohq/messaging';
import { Console, Data, Effect, Option } from 'effect';
import type { GlobalContentScriptMessage, globalContentScriptCommands } from '~contents/global';
import type { WhisperingMessage, whisperingCommands } from '~contents/whispering';
import { getActiveTabId } from './messages/getActiveTabId';

export type BackgroundServiceWorkerResponse<T> =
	| {
			data: T;
			error: null;
	  }
	| {
			data: null;
			error: BackgroundServiceWorkerError;
	  };

type ExtractData<T> = T extends { data: infer U; error: null } ? U : never;
type ExtractError<T> = T extends { data: null; error: infer U } ? U : never;

export const sendToBgsw = <
	RequestBody,
	ResponseBody extends BackgroundServiceWorkerResponse<any>,
	TData = ExtractData<ResponseBody>,
	TError = ExtractError<ResponseBody>,
>(
	...args: Parameters<typeof sendToBackground<RequestBody, ResponseBody>>
) =>
	Effect.tryPromise({
		try: () => sendToBackground<RequestBody, ResponseBody>(...args),
		catch: (error) =>
			new BackgroundServiceWorkerError({
				title: `Error sending message ${args[0].name} to background service worker`,
				description: error instanceof Error ? error.message : undefined,
				error,
			}),
	}).pipe(
		Effect.flatMap(({ data, error }) => {
			if (error) return Effect.fail(error as TError);
			return Effect.succeed(data as TData);
		}),
	);

export const sendMessageToWhisperingContentScript = <Message extends WhisperingMessage>(
	message: Message,
) =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTabId;
		yield* Console.info('Whispering tab ID:', whisperingTabId);
		yield* Console.info('Sending message to Whispering content script:', message);
		const response = yield* Effect.promise(() =>
			chrome.tabs.sendMessage<
				Message,
				Effect.Effect.Success<ReturnType<(typeof whisperingCommands)[Message['commandName']]>>
			>(whisperingTabId, message),
		);
		yield* Console.info('Response from Whispering content script:', response);
		return response;
	});

export const sendMessageToGlobalContentScript = <Message extends GlobalContentScriptMessage>(
	message: Message,
) =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		yield* Console.info('Active tab ID:', activeTabId);
		yield* Console.info('Sending message to global content script:', message);
		const response = yield* Effect.promise(() =>
			chrome.tabs.sendMessage<
				Message,
				Effect.Effect.Success<
					ReturnType<(typeof globalContentScriptCommands)[Message['commandName']]>
				>
			>(activeTabId, message),
		);
		yield* Console.info('Response from global content script:', response);
		return response;
	});

export class BackgroundServiceWorkerError extends Data.TaggedError('BackgroundServiceWorkerError')<{
	title: string;
	description?: string;
	error?: unknown;
}> {}

const getOrCreateWhisperingTabId = Effect.gen(function* () {
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
		() => new BackgroundServiceWorkerError({ title: 'Error getting or creating Whispering tab' }),
	),
);

// const syncIconWithExtensionStorage = Effect.gen(function* () {
// 	yield* extensionStorage.watch({
// 		key: 'whispering-recording-state',
// 		schema: recorderStateSchema,
// 		callback: (recordingState) =>
// 			Effect.gen(function* () {
// 				switch (recordingState) {
// 					case 'IDLE':
// 						yield* Effect.tryPromise({
// 							try: () => chrome.action.setIcon({ path: studioMicrophone }),
// 							catch: () =>
// 								new BackgroundServiceWorkerError({
// 									message: 'Error setting icon to studio microphone',
// 								}),
// 						});
// 					case 'RECORDING':
// 						yield* Effect.tryPromise({
// 							try: () => chrome.action.setIcon({ path: redLargeSquare }),
// 							catch: () =>
// 								new BackgroundServiceWorkerError({ message: 'Error setting icon to stop icon' }),
// 						});
// 				}
// 			}),
// 	});
// }).pipe(Effect.runSync);

export const openOptionsPage = Effect.tryPromise({
	try: () => chrome.runtime.openOptionsPage(),
	catch: (error) =>
		new BackgroundServiceWorkerError({
			title: 'Error opening options page',
			description: error instanceof Error ? error.message : undefined,
			error,
		}),
});

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason === 'install') {
			yield* openOptionsPage;
		}
	}).pipe(Effect.runPromise),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info(
			'Received command in background service worker via Chrome Keyboard Shortcut',
			{ command },
		);
		if (command !== 'toggleRecording') return false;
		const program = Effect.gen(function* () {
			yield* sendMessageToGlobalContentScript({ commandName: 'toggleRecording', args: [] });
			return true as const;
		});
		program.pipe(Effect.runPromise);
		return true;
	}).pipe(Effect.runSync),
);
