import { Console, Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { registerExternalListener } from './external-messages';
import { openOptionsPage } from './messages/openOptionsPage';
import { toggleRecording } from './messages/toggleRecording';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason !== 'install') return;
		yield* openOptionsPage;
	}).pipe(
		Effect.catchAll(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		Effect.runPromise,
	),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info('Received command via Chrome Keyboard Shortcut', command);
		if (command !== 'toggleRecording') return false;
		yield* toggleRecording;
	}).pipe(
		Effect.catchAll(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		Effect.runPromise,
	),
);

registerExternalListener();
