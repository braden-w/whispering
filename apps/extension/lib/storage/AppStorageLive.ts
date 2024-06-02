import { Effect, Layer } from 'effect';
import {
	AppStorageError,
	AppStorageService,
} from '../../../../packages/services/src/services/app-storage';
import { sendMessageToContentScript } from '~lib/utils/messaging';

export const AppStorageFromContentScriptLive = Layer.succeed(
	AppStorageService,
	AppStorageService.of({
		get: ({ key, schema, defaultValue }) =>
			Effect.try({
				try: () => {
					const valueFromStorage = localStorage.getItem(key);
					const isEmpty = valueFromStorage === null;
					if (isEmpty) return defaultValue;
					return schema.parse(JSON.parse(valueFromStorage));
				},
				catch: (error) =>
					new AppStorageError({
						message: `Error getting from local storage for key: ${key}`,
						origError: error,
					}),
			}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
		set: ({ key, value }) =>
			Effect.try({
				try: () => localStorage.setItem(key, value),
				catch: (error) =>
					new AppStorageError({
						message: `Error setting in local storage for key: ${key}`,
						origError: error,
					}),
			}),
	}),
);

export const AppStorageFromPopupLive = Layer.effect(
	AppStorageService,
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTab;
		return {
			get: ({ key, schema, defaultValue }) =>
				Effect.promise(() =>
					sendMessageToContentScript(whisperingTabId, { action: 'getLocalStorage', key }),
				),
			set: ({ key, value }) =>
				Effect.promise(() =>
					sendMessageToContentScript(whisperingTabId, {
						action: 'setLocalStorage',
						key,
						value,
					}),
				),
		};
	}),
);

const getOrCreateWhisperingTab = Effect.gen(function* (_) {
	const tabs = yield* Effect.promise(() => chrome.tabs.query({ url: 'http://localhost:5173/*' }));
	console.log('🚀 ~ chrome.tabs.query ~ tabs:', tabs);
	if (tabs.length > 0) {
		for (const tab of tabs) {
			if (tab.pinned) {
				return tab.id;
			}
		}
		return tabs[0].id;
	} else {
		const newTab = yield* Effect.promise(() =>
			chrome.tabs.create({
				url: 'http://localhost:5173',
				active: false,
				pinned: true,
			}),
		);
		return newTab.id;
	}
});
