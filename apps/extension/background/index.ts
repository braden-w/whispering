import { Console, Effect } from 'effect';
import { sendMessageToGlobalContentScript } from './sendMessage';
import { BackgroundServiceWorkerError } from '~lib/commands';

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
