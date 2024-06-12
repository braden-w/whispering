import { Console, Effect, Option } from 'effect';
import type { WhisperingMessage } from '~contents/whispering';
import { WhisperingError } from '~lib/errors';

const pinTab = (tabId: number) => Effect.promise(() => chrome.tabs.update(tabId, { pinned: true }));

const getWhisperingTabId: Effect.Effect<Option.Option<number>> = Effect.gen(function* () {
	const whisperingTabs = yield* Effect.promise(() =>
		chrome.tabs.query({ url: 'http://localhost:5173/*' }),
	);
	if (whisperingTabs.length === 0) return Option.none();

	const pinnedAwakeTab = whisperingTabs.find((tab) => tab.pinned && !tab.discarded);
	if (pinnedAwakeTab) return Option.fromNullable(pinnedAwakeTab.id);

	const unpinnedAwakeTab = whisperingTabs.find((tab) => !tab.pinned && !tab.discarded);
	if (unpinnedAwakeTab && unpinnedAwakeTab.id) {
		yield* pinTab(unpinnedAwakeTab.id);
		return Option.some(unpinnedAwakeTab.id);
	}

	const someDiscardedTab = whisperingTabs[0];
	if (!someDiscardedTab) return Option.none();
	const reloadedTabId = yield* Effect.async<Option.Option<number>>((resume) => {
		if (!someDiscardedTab.id) {
			resume(Effect.succeed(Option.none()));
			return;
		}
		chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
			if (updatedTabId === someDiscardedTab.id && changeInfo.status === 'complete') {
				resume(Effect.succeed(Option.some(someDiscardedTab.id)));
				chrome.tabs.onUpdated.removeListener(listener);
			}
		});
		chrome.tabs.reload(someDiscardedTab.id);
	});
	return reloadedTabId;
});

const createWhisperingTabId = Effect.gen(function* () {
	const newTab = yield* Effect.promise(() =>
		chrome.tabs.create({ url: 'http://localhost:5173', active: false, pinned: true }),
	);
	return Option.fromNullable(newTab.id);
});

export const getOrCreateWhisperingTabId = Effect.gen(function* () {
	const maybeFoundWhisperingId = yield* getWhisperingTabId;
	if (Option.isSome(maybeFoundWhisperingId)) return maybeFoundWhisperingId;
	const maybeCreatedWhisperingid = yield* createWhisperingTabId;
	return maybeCreatedWhisperingid;
});

export const sendMessageToWhisperingContentScript = <R>(message: WhisperingMessage) =>
	Effect.gen(function* () {
		const maybeWhisperingTabId = yield* getOrCreateWhisperingTabId;
		if (Option.isNone(maybeWhisperingTabId)) {
			return yield* new WhisperingError({
				title: 'Whispering tab not found',
				description: `Could not find a Whispering tab to call "${message.commandName}" command`,
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
