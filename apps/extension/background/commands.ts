import { Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/commands';
import type { Settings } from '~lib/services/local-storage';
import { getOrCreateWhisperingTabId, sendMessageToWhisperingContentScript } from './sendMessage';
import toggleRecording from './toggleRecording';

export const commands = {
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
};
