import { Console, Effect } from 'effect';
import { toggleRecording } from '~background/messages/whispering-web/toggleRecording';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === 'install') await chrome.runtime.openOptionsPage();
});

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* () {
		yield* Console.info(
			'Received command via Chrome Keyboard Shortcut',
			command,
		);
		if (command !== 'toggleRecording') return false;
		yield* toggleRecording;
	}).pipe(
		Effect.catchAll(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		Effect.runPromise,
	),
);
