import { Option, Console, Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/commands';
import type { GlobalContentScriptMessage, globalContentScriptCommands } from '~contents/global';
import type { Settings } from '~lib/services/local-storage';
import toggleRecording from './scripts/toggleRecording';
import { whisperingCommands, type WhisperingMessage } from '~contents/whispering';

const getOrCreateWhisperingTabId = Effect.gen(function* () {
	const tabs = yield* Effect.promise(() => chrome.tabs.query({ url: 'http://localhost:5173/*' }));
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
}).pipe(
	Effect.flatMap(Option.fromNullable),
	Effect.mapError(
		(error) =>
			new BackgroundServiceWorkerError({
				title: 'Error getting or creating Whispering tab',
				error,
			}),
	),
);

const sendMessageToWhisperingContentScript = <Message extends WhisperingMessage>(
	message: Message,
) =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTabId;
		yield* Console.info('Whispering tab ID:', whisperingTabId);
		yield* Console.info('Sending message to Whispering content script:', message);
		const response = yield* Effect.promise(() =>
			chrome.tabs.sendMessage<
				Message,
				Effect.Effect.Success<ReturnType<(typeof whisperingCommands)[Message['commandName']]>>
			>(whisperingTabId, message),
		);
		yield* Console.info('Response from Whispering content script:', response);
		return response;
	});

export const sendMessageToGlobalContentScript = <Message extends GlobalContentScriptMessage>(
	message: Message,
) =>
	Effect.gen(function* () {
		const activeTabId = yield* serviceWorkerCommands.getActiveTabId;
		yield* Console.info('Active tab ID:', activeTabId);
		yield* Console.info('Sending message to global content script:', message);
		const response = yield* Effect.promise(() =>
			chrome.tabs.sendMessage<
				Message,
				Effect.Effect.Success<
					ReturnType<(typeof globalContentScriptCommands)[Message['commandName']]>
				>
			>(activeTabId, message),
		);
		yield* Console.info('Response from global content script:', response);
		return response;
	});

export type BackgroundServiceWorkerResponse<T> =
	| {
			data: T;
			error: null;
	  }
	| {
			data: null;
			error: BackgroundServiceWorkerError;
	  };

export const serviceWorkerCommands = {
	openOptionsPage: Effect.tryPromise({
		try: () => chrome.runtime.openOptionsPage(),
		catch: (error) =>
			new BackgroundServiceWorkerError({
				title: 'Error opening options page',
				description: error instanceof Error ? error.message : undefined,
				error,
			}),
	}),
	toggleRecording: Effect.gen(function* () {
		const tabId = yield* getOrCreateWhisperingTabId;
		chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func: toggleRecording,
		});
		return true as const;
	}),
	cancelRecording: Effect.gen(function* () {
		const tabId = yield* getOrCreateWhisperingTabId;
		chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func: () => window.cancelRecording(),
		});
		return true as const;
	}),
	getSettings: Effect.gen(function* () {
		const settings = yield* sendMessageToWhisperingContentScript({
			commandName: 'getSettings',
			args: [],
		});
		return settings;
	}),
	setSettings: (settings: Settings) =>
		Effect.gen(function* () {
			yield* sendMessageToWhisperingContentScript({
				commandName: 'setSettings',
				args: [settings],
			});
		}),
	getActiveTabId: Effect.gen(function* () {
		const activeTabs = yield* Effect.tryPromise({
			try: () => chrome.tabs.query({ active: true, currentWindow: true }),
			catch: (error) =>
				new BackgroundServiceWorkerError({
					title: 'Error getting active tabs',
					error: error,
				}),
		});
		const firstActiveTab = activeTabs[0];
		if (!firstActiveTab.id) {
			return yield* new BackgroundServiceWorkerError({ title: 'No active tab found' });
		}
		return firstActiveTab.id;
	}),
};
