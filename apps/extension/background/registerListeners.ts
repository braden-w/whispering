import { Console, Effect } from 'effect';
import { openOptionsPage } from './messages/openOptionsPage';
import { toggleRecording } from './messages/toggleRecording';

export const registerOnInstallOpenOptionsPage = Effect.sync(() =>
	chrome.runtime.onInstalled.addListener((details) =>
		Effect.gen(function* () {
			if (details.reason !== 'install') return;
			yield* openOptionsPage;
		}).pipe(Effect.runPromise),
	),
);

export const registerOnCommandToggleRecording = Effect.sync(() =>
	chrome.commands.onCommand.addListener((command) =>
		Effect.gen(function* () {
			yield* Console.info('Received command via Chrome Keyboard Shortcut', command);
			if (command !== 'toggleRecording') return false;
			yield* toggleRecording;
			return true;
		}).pipe(Effect.runPromise),
	),
);
