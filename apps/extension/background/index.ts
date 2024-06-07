import { Console, Data, Effect, Option } from 'effect';
import type { globalContentScriptCommands } from '~contents/global';
import type { whisperingCommands } from '~contents/whispering';
import {
	type BackgroundServiceWorkerMessage,
	type ExtensionMessage,
	type GlobalContentScriptMessage,
	type WhisperingMessage,
} from '~lib/commands';

class BackgroundServiceWorkerError extends Data.TaggedError('BackgroundServiceWorkerError')<{
	message: string;
	origError?: unknown;
}> {}

const getActiveTabId = Effect.gen(function* () {
	const activeTabs = yield* Effect.tryPromise({
		try: () => chrome.tabs.query({ active: true, currentWindow: true }),
		catch: (error) =>
			new BackgroundServiceWorkerError({
				message: 'Error getting active tabs',
				origError: error,
			}),
	});
	const firstActiveTab = activeTabs[0];
	if (!firstActiveTab.id) {
		return yield* new BackgroundServiceWorkerError({ message: 'No active tab found' });
	}
	return firstActiveTab.id;
});

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
		() => new BackgroundServiceWorkerError({ message: 'Error getting or creating Whispering tab' }),
	),
);

export const commands = {
	openOptionsPage: () =>
		Effect.tryPromise({
			try: () => chrome.runtime.openOptionsPage(),
			catch: (e) =>
				new BackgroundServiceWorkerError({ message: 'Error opening options page', origError: e }),
		}),
	sendMessageToWhisperingContentScript: <Message extends WhisperingMessage>(message: Message) =>
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
		}),
	sendMessageToGlobalContentScript: <Message extends GlobalContentScriptMessage>(
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
		}),
} as const;

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

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason === 'install') {
			yield* commands.openOptionsPage();
		}
	}).pipe(Effect.runPromise),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info('Received command in background service worker', { command });
		if (command !== 'toggleRecording') return false;
		const program = Effect.gen(function* () {
			yield* Console.info('Toggling recording from background service worker');
			yield* commands.sendMessageToGlobalContentScript({
				commandName: 'toggleRecording',
				args: [],
			});
		});
		program.pipe(Effect.runPromise);
		return true;
	}).pipe(Effect.runSync),
);

const isBackgroundServiceWorkerMessage = (
	message: ExtensionMessage,
): message is BackgroundServiceWorkerMessage => message.commandName in commands;

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: ExtensionMessage, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			if (!isBackgroundServiceWorkerMessage(message)) return false;
			const { commandName, args } = message;
			yield* Console.info('Received message in BackgroundServiceWorker', { commandName, args });
			const correspondingCommand = commands[commandName];
			const response = yield* correspondingCommand(...args);
			yield* Console.info(
				`Responding to invoked command ${commandName} in BackgroundServiceWorker`,
				{
					response,
				},
			);
			sendResponse(response);
		});
		program.pipe(Effect.runPromise);
		return true; // Will respond asynchronously.
	},
);
