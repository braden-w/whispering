import { Effect } from 'effect';
import { ExtensionApiService } from '~lib/storage/ExtensionApi';
import { ExtensionApiFromBackgroundLive } from '~lib/storage/ExtensionApiLive';
import { type MessageToBackgroundRequest } from '~lib/utils/messaging';

Effect.gen(function* () {
	const extensionApiService = yield* ExtensionApiService;

	chrome.runtime.onInstalled.addListener((details) =>
		Effect.gen(function* (_) {
			if (details.reason === 'install') {
				yield* extensionApiService.openOptionsPage();
			}
		}).pipe(Effect.runSync),
	);

	chrome.commands.onCommand.addListener((command) =>
		Effect.gen(function* () {
			if (command === 'toggle-recording') {
				const activeTabId = yield* extensionApiService.getCurrentTabId();
				yield* extensionApiService.sendMessageToContentScript(activeTabId, {
					action: 'toggle-recording',
				});
			}
		}).pipe(Effect.runPromise),
	);

	chrome.runtime.onMessage.addListener((message: MessageToBackgroundRequest) =>
		Effect.gen(function* () {
			switch (message.action) {
				case 'setIcon':
					const { icon } = message;
					yield* extensionApiService.setIcon(icon);
					break;
				case 'openOptionsPage':
					chrome.runtime.openOptionsPage();
					break;
			}
		}).pipe(Effect.runPromise),
	);
}).pipe(Effect.provide(ExtensionApiFromBackgroundLive), Effect.runSync);
