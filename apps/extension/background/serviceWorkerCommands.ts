import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { Console, Effect, Option } from 'effect';
import { whisperingCommands, type WhisperingMessage } from '~contents/whispering';
import { BackgroundServiceWorkerError } from '~lib/commands';
import type { WhisperingErrorProperties } from '~lib/errors';
import type { Settings } from '~lib/services/local-storage';
import cancelRecording from './scripts/cancelRecording';
import toggleRecording from './scripts/toggleRecording';

const getOrCreateWhisperingTabId = Effect.gen(function* () {
	const tabs = yield* Effect.promise(() => chrome.tabs.query({ url: 'http://localhost:5173/*' }));
	if (tabs.length > 0) {
		for (const tab of tabs) {
			if (tab.pinned) {
				if (tab.discarded) {
					yield* Effect.promise(() => chrome.tabs.reload(tab.id));
				}
				return tab.id;
			}
		}
		if (tabs[0].discarded) {
			yield* Effect.promise(() => chrome.tabs.reload(tabs[0].id));
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

export type BackgroundServiceWorkerResponse<
	T,
	E extends WhisperingErrorProperties = WhisperingErrorProperties,
> =
	| {
			data: T;
			error: null;
	  }
	| {
			data: null;
			error: E;
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
	setIcon: (icon: 'IDLE' | 'STOP' | 'LOADING') =>
		Effect.tryPromise({
			try: () => {
				const path = ((icon: 'IDLE' | 'STOP' | 'LOADING') => {
					switch (icon) {
						case 'IDLE':
							return studioMicrophone;
						case 'STOP':
							return redLargeSquare;
						case 'LOADING':
							return arrowsCounterclockwise;
					}
				})(icon);
				return chrome.action.setIcon({ path });
			},
			catch: (error) =>
				new BackgroundServiceWorkerError({
					title: `Error setting icon to ${icon} icon`,
					description: error instanceof Error ? error.message : undefined,
					error,
				}),
		}).pipe(Effect.tap(() => Console.info('Icon set to', icon))),
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
			func: cancelRecording,
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
