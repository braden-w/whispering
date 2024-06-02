import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Effect, Layer } from 'effect';
import { ExtensionApiError, ExtensionApiService } from './ExtensionApi';

export const ExtensionApiFromBackgroundLive = Layer.succeed(
	ExtensionApiService,
	ExtensionApiService.of({
		getCurrentTabId: () =>
			Effect.gen(function* () {
				const activeTabs = yield* Effect.tryPromise({
					try: () => chrome.tabs.query({ active: true, currentWindow: true }),
					catch: (error) =>
						new ExtensionApiError({
							message: 'Error getting active tabs',
							origError: error,
						}),
				});
				if (!activeTabs[0]) {
					return yield* new ExtensionApiError({ message: 'No active tab found' });
				}
				return activeTabs[0].id;
			}),
		sendMessageToContentScript: (tabId, message, options) =>
			Effect.promise(() => chrome.tabs.sendMessage(tabId, message, options)),
		openOptionsPage: () => Effect.sync(() => chrome.runtime.openOptionsPage()),
		setIcon: (icon) =>
			Effect.gen(function* () {
				switch (icon) {
					case 'studioMicrophone':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: studioMicrophone }),
							catch: () =>
								new ExtensionApiError({ message: 'Error setting icon to studio microphone' }),
						});
						break;
					case 'redLargeSquare':
						yield* Effect.tryPromise({
							try: () => chrome.action.setIcon({ path: redLargeSquare }),
							catch: () =>
								new ExtensionApiError({ message: 'Error setting icon to red large square' }),
						});
						break;
				}
			}),
	}),
);
