import { Console, Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { registerExternalListener } from './external-messages';
import { openOptionsPage } from './messages/openOptionsPage';
import { toggleRecording } from './messages/toggleRecording';

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason !== 'install') return;
		yield* openOptionsPage;
	}).pipe(Effect.catchAll(renderErrorAsToast('bgsw')), Effect.runPromise),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info('Received command via Chrome Keyboard Shortcut', command);
		if (command !== 'toggleRecording') return false;
		yield* toggleRecording;
		return true;
	}).pipe(Effect.catchAll(renderErrorAsToast('bgsw')), Effect.runPromise),
);

registerExternalListener();
