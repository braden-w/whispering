import { Console, Effect } from 'effect';
import { z } from 'zod';
import { extensionStorage } from '~lib/services/extension-storage';
import { recorderStateSchema } from '~lib/recorderStateSchema';
import { serviceWorkerCommands } from './serviceWorkerCommands';

export const registerOnInstallOpenOptionsPage = Effect.sync(() =>
	chrome.runtime.onInstalled.addListener((details) =>
		Effect.gen(function* () {
			if (details.reason !== 'install') return;
			yield* serviceWorkerCommands.openOptionsPage;
		}).pipe(Effect.runPromise),
	),
);

export const registerOnCommandToggleRecording = Effect.sync(() =>
	chrome.commands.onCommand.addListener((command) =>
		Effect.gen(function* () {
			yield* Console.info('Received command via Chrome Keyboard Shortcut', command);
			if (command !== 'toggleRecording') return false;
			yield* serviceWorkerCommands.toggleRecording;
			return true;
		}).pipe(Effect.runPromise),
	),
);

export const registerOnMessageExternalToggleRecording = Effect.sync(() =>
	chrome.runtime.onMessageExternal.addListener((requestUnparsed, sender, sendResponse) =>
		Effect.gen(function* () {
			yield* Console.info('Received message from external website', requestUnparsed);
			const { recorderState } = z
				.object({ recorderState: recorderStateSchema })
				.parse(requestUnparsed);
			yield* extensionStorage.set({
				key: 'whispering-recording-state',
				value: recorderState,
			});
			switch (recorderState) {
				case 'IDLE':
					yield* serviceWorkerCommands.setIcon('IDLE');
					return;
				case 'RECORDING':
					yield* serviceWorkerCommands.setIcon('STOP');
					return;
			}
		}).pipe(Effect.runPromise),
	),
);
