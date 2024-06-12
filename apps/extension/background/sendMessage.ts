import { Console, Effect, Option } from 'effect';
import type { WhisperingMessage } from '~contents/whispering';
import { WhisperingError } from '~lib/errors';

export const getWhisperingTabId: Effect.Effect<Option.Option<number>> = Effect.gen(function* () {
	const whisperingTabs = yield* Effect.promise(() =>
		chrome.tabs.query({ url: 'http://localhost:5173/*' }),
	);
	if (whisperingTabs.length === 0) return Option.none();
	const selectedTab =
		whisperingTabs.find((tab) => tab.pinned && !tab.discarded) ??
		whisperingTabs.find((tab) => !tab.discarded) ??
		whisperingTabs[0];
	if (selectedTab.discarded) {
		const reloadedTabId = yield* Effect.async<Option.Option<number>>((resume) => {
			if (!selectedTab.id) {
				resume(Effect.succeed(Option.none()));
				return;
			}
			chrome.tabs.reload(selectedTab.id);
			chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
				if (updatedTabId === selectedTab.id && changeInfo.status === 'complete') {
					resume(Effect.succeed(Option.some(selectedTab.id)));
					chrome.tabs.onUpdated.removeListener(listener);
				}
			});
		});
		return reloadedTabId;
	}
	return Option.fromNullable(selectedTab.id);
});

export const createWhisperingTab = Effect.gen(function* () {
	const newTab = yield* Effect.promise(() =>
		chrome.tabs.create({ url: 'http://localhost:5173', active: false, pinned: true }),
	);
	return Option.fromNullable(newTab.id);
});

export const sendMessageToWhisperingContentScript = <R>(message: WhisperingMessage) =>
	Effect.gen(function* () {
		const maybeWhisperingTabId = yield* getWhisperingTabId;
		if (Option.isNone(maybeWhisperingTabId)) {
			return yield* new WhisperingError({
				title: 'Whispering tab not found',
				description: `Could not find a Whispering tab to call command: ${message.commandName}`,
			});
		}
		const whisperingTabId = maybeWhisperingTabId.value;
		yield* Console.info('Whispering tab ID:', whisperingTabId);
		yield* Console.info('Sending message to Whispering content script:', message);
		const response = yield* Effect.promise(() =>
			chrome.tabs.sendMessage<WhisperingMessage, R>(whisperingTabId, message),
		);
		yield* Console.info('Response from Whispering content script:', response);
		return response;
	});
