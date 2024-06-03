import { Effect } from 'effect';
import { ExtensionApiService } from '~lib/storage/ExtensionApi';
import { ExtensionApiFromBackgroundLive } from '~lib/storage/ExtensionApiLive';
import { type MessageToBackgroundRequest } from '~lib/utils/messaging';
import { Storage } from '@plasmohq/storage';

Effect.gen(function* () {
	const extensionApiService = yield* ExtensionApiService;

	const storage = new Storage();
	storage.watch({
		'whispering-recording-state': (c) =>
			Effect.gen(function* () {
				switch (c.newValue) {
					case 'RECORDING':
						yield* extensionApiService.syncIconToRecorderState('RECORDING');
						break;
					case 'IDLE':
						yield* extensionApiService.syncIconToRecorderState('IDLE');
						break;
				}
			}).pipe(Effect.runSync),
	});

	chrome.runtime.onInstalled.addListener((details) =>
		Effect.gen(function* () {
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
				case 'syncIconToRecorderState':
					const { icon } = message;
					yield* extensionApiService.syncIconToRecorderState(icon);
					break;
				case 'openOptionsPage':
					yield* extensionApiService.openOptionsPage();
					break;
			}
		}).pipe(Effect.runPromise),
	);
}).pipe(Effect.provide(ExtensionApiFromBackgroundLive), Effect.runSync);
