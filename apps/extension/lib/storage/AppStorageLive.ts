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
					const unparsedValue = localStorage.getItem(key);
					if (unparsedValue === null) {
						return defaultValue;
					}
					return schema.parse(unparsedValue);
				},
				catch: () => defaultValue,
			}),
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
				Effect.gen(function* () {
					yield* sendMessageToContentScript(whisperingTabId, {action: 'getLocalStorage'})
					
				}),
			set: ({ key, value }) =>
				Effect.try({
					try: () => localStorage.setItem(key, value),
					catch: (error) =>
						new AppStorageError({
							message: `Error setting in local storage for key: ${key}`,
							origError: error,
						}),
				}),
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
