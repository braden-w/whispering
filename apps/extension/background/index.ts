import { Console, Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';
import { openOptionsPage } from './messages/openOptionsPage';
import { toggleRecording } from './messages/contents/toggleRecording';

chrome.runtime.onInstalled.addListener((details) =>
	Effect.gen(function* () {
		if (details.reason !== 'install') return;
		yield* openOptionsPage;
	}).pipe(
		Effect.catchAll(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		Effect.runPromise,
	),
);

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info('Received command via Chrome Keyboard Shortcut', command);
		if (command !== 'toggleRecording') return false;
		yield* toggleRecording;
	}).pipe(
		Effect.catchAll(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		Effect.runPromise,
	),
);
