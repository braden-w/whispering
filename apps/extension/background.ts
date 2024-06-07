import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Console, Data, Effect } from 'effect';
import {
	sendMessageToGlobalContentScript,
	type BackgroundServiceWorkerMessage,
	type ExtensionMessage,
} from '~lib/commands';
import { recorderStateSchema } from '~lib/services/recorder';
import { extensionStorage } from '~lib/services/storage';

class BackgroundServiceWorkerError extends Data.TaggedError('BackgroundServiceWorkerError')<{
	message: string;
	origError?: unknown;
}> {}

export const backgroundServiceWorkerCommands = {
	openOptionsPage: () =>
		Effect.tryPromise({
			try: () => chrome.runtime.openOptionsPage(),
			catch: (e) =>
				new BackgroundServiceWorkerError({ message: 'Error opening options page', origError: e }),
		}),
	getCurrentTabId: () =>
		Effect.gen(function* () {
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
		}),
} as const;

const syncIconWithExtensionStorage = Effect.gen(function* () {
	yield* extensionStorage.watch({
		key: 'whispering-recording-state',
		schema: recorderStateSchema,
		callback: (recordingState) =>
			Effect.gen(function* () {
				switch (recordingState) {
					case 'IDLE':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: studioMicrophone }),
							catch: () =>
								new BackgroundServiceWorkerError({
									message: 'Error setting icon to studio microphone',
								}),
						});
					case 'RECORDING':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: redLargeSquare }),
							catch: () =>
								new BackgroundServiceWorkerError({ message: 'Error setting icon to stop icon' }),
						});
				}
			}),
	});
}).pipe(Effect.runSync);

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason === 'install') {
			yield* backgroundServiceWorkerCommands.openOptionsPage();
		}
	}).pipe(Effect.runPromise),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info('Received command in background service worker', { command });
		if (command !== 'toggleRecording') return false;
		const program = Effect.gen(function* () {
			yield* Console.info('Toggling recording from background service worker');
			yield* sendMessageToGlobalContentScript({ commandName: 'toggleRecording', args: [] });
		});
		program.pipe(Effect.runPromise);
		return true;
	}).pipe(Effect.runSync),
);

const isBackgroundServiceWorkerMessage = (
	message: ExtensionMessage,
): message is BackgroundServiceWorkerMessage =>
	message.commandName in backgroundServiceWorkerCommands;

const _registerListeners = chrome.runtime.onMessage.addListener(
	(message: ExtensionMessage, sender, sendResponse) => {
		const program = Effect.gen(function* () {
			if (!isBackgroundServiceWorkerMessage(message)) return false;
			const { commandName, args } = message;
			yield* Console.info('Received message in BackgroundServiceWorker', { commandName, args });
			const correspondingCommand = backgroundServiceWorkerCommands[commandName];
			yield* Console.info('Corresponding command:', correspondingCommand);
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
