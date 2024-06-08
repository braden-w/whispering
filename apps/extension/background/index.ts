import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import { Console, Effect } from 'effect';
import { sendMessageToGlobalContentScript } from './sendMessage';
import { BackgroundServiceWorkerError } from '~lib/commands';
import { extensionStorage } from '~lib/services/extension-storage';

const _syncIconWithExtensionStorage = Effect.gen(function* () {
	yield* extensionStorage.watch({
		key: 'whispering-recording-state',
		callback: (recordingState) =>
			Effect.gen(function* () {
				switch (recordingState) {
					case 'IDLE':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: studioMicrophone }),
							catch: (error) =>
								new BackgroundServiceWorkerError({
									title: 'Error setting icon to studio microphone',
									description: error instanceof Error ? error.message : undefined,
									error,
								}),
						});
					case 'RECORDING':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: redLargeSquare }),
							catch: (error) =>
								new BackgroundServiceWorkerError({
									title: 'Error setting icon to stop icon',
									description: error instanceof Error ? error.message : undefined,
									error,
								}),
						});
				}
			}),
	});
}).pipe(Effect.runSync);

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
