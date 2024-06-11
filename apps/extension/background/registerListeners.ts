import { Console, Effect } from 'effect';
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
