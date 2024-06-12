import { Console, Effect, Option } from 'effect';
import { whisperingCommands, type WhisperingMessage } from '~contents/whispering';
import { BackgroundServiceWorkerError } from '~lib/commands';
import type { Settings } from '~lib/services/local-storage';
import cancelRecording from './scripts/cancelRecording';
import toggleRecording from './scripts/toggleRecording';

const getOrCreateWhisperingTabId = Effect.gen(function* () {
	const tabs = yield* Effect.promise(() => chrome.tabs.query({ url: 'http://localhost:5173/*' }));
	if (tabs.length === 0) {
		const newTab = yield* Effect.promise(() =>
			chrome.tabs.create({
				url: 'http://localhost:5173',
				active: false,
				pinned: true,
			}),
		);
		return newTab.id;
	}
	const { id: selectedTabId, discarded: isSelectedTabDiscarded } =
		tabs.find((tab) => tab.pinned) ?? tabs[0];
	if (!selectedTabId) {
		return yield* new BackgroundServiceWorkerError({
			title: 'Whispering tab does not have Tab ID',
		});
	}
	if (isSelectedTabDiscarded) {
		return yield* Effect.async<number>((resume) => {
			chrome.tabs.reload(selectedTabId);
			chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
				if (updatedTabId === selectedTabId && changeInfo.status === 'complete') {
					resume(Effect.succeed(selectedTabId));
					chrome.tabs.onUpdated.removeListener(listener);
				}
			});
		});
	}
	return selectedTabId;
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
			func: () => window.toggleRecording(),
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
