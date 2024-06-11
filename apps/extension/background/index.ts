import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Console, Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/commands';
import { extensionStorage } from '~lib/services/extension-storage';
import { commands } from './commands';

Effect.gen(function* () {
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

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason === 'install') {
			yield* commands.openOptionsPage;
		}
	}).pipe(Effect.runPromise),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info('Received command via Chrome Keyboard Shortcut', command);
		if (command !== 'toggleRecording') return false;
		yield* commands.toggleRecording;
		return true;
	}).pipe(Effect.runSync),
);
