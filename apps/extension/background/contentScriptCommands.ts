import { Schema as S } from '@effect/schema';
import {
	WHISPERING_URL,
	WHISPERING_URL_WILDCARD,
	WhisperingError,
	externalMessageSchema,
	type ExternalMessage,
} from '@repo/shared';
import { Effect, Either, Option } from 'effect';

const pinTab = (tabId: number) => Effect.promise(() => chrome.tabs.update(tabId, { pinned: true }));

const isNotifyWhisperingTabReadyMessage = (
	message: unknown,
): message is Extract<ExternalMessage, { name: 'external/notifyWhisperingTabReady' }> => {
	const externalMessageResult = S.decodeUnknownEither(externalMessageSchema)(message);
	if (Either.isLeft(externalMessageResult)) return false;
	const externalMessage = externalMessageResult.right;
	return externalMessage.name === 'external/notifyWhisperingTabReady';
};

const getTabIdAfterActionComplete = <T>({
	specificTabId,
	action,
}: {
	specificTabId?: number;
	action: () => Promise<T>;
}) =>
	Effect.async<number>((resume) => {
		chrome.runtime.onMessage.addListener(
			function contentReadyListener(message, sender, sendResponse) {
				if (!isNotifyWhisperingTabReadyMessage(message)) return;
				const isReadyTabValid = specificTabId === undefined || message.body.tabId === specificTabId;
				if (!isReadyTabValid) return;
				resume(Effect.succeed(message.body.tabId));
				chrome.runtime.onMessage.removeListener(contentReadyListener);
			},
		);
		// Perform your desired action here
		action();
	});

export const getOrCreateWhisperingTabId = Effect.gen(function* () {
	const whisperingTabs = yield* Effect.promise(() =>
		chrome.tabs.query({ url: WHISPERING_URL_WILDCARD }),
	);
	if (whisperingTabs.length === 0) {
		const newTabId = yield* getTabIdAfterActionComplete({
			action: () => chrome.tabs.create({ url: WHISPERING_URL, active: false, pinned: true }),
		});
		return yield* Option.some(newTabId);
	}

	const pinnedAwakeTab = whisperingTabs.find((tab) => tab.pinned && !tab.discarded);
	if (pinnedAwakeTab) return yield* Option.fromNullable(pinnedAwakeTab.id);

	const unpinnedAwakeTab = whisperingTabs.find((tab) => !tab.pinned && !tab.discarded);
	if (unpinnedAwakeTab && unpinnedAwakeTab.id) {
		yield* pinTab(unpinnedAwakeTab.id);
		return yield* Option.some(unpinnedAwakeTab.id);
	}

	const someDiscardedTabId = whisperingTabs[0]?.id;
	if (!someDiscardedTabId) return yield* Option.none();
	const reloadedTabId = yield* getTabIdAfterActionComplete({
		specificTabId: someDiscardedTabId,
		action: () => chrome.tabs.reload(someDiscardedTabId),
	});
	yield* pinTab(reloadedTabId);
	return yield* Option.some(reloadedTabId);
}).pipe(
	Effect.mapError(
		(noSuchElementException) =>
			new WhisperingError({
				title: 'Whispering tab not found',
				description: 'Could not find or create a Whispering tab to call command',
				error: noSuchElementException,
			}),
	),
);

export const SETTINGS_KEY = 'whispering-settings' as const;
