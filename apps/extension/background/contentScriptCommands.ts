import { Schema as S } from '@effect/schema';
import {
	RegisterShortcutsService,
	RegisterShortcutsWebLive,
	WhisperingError,
	resultToEffect,
	settingsSchema,
	type Result,
	type Settings,
} from '@repo/shared';
import { Console, Effect, Either, Option, pipe } from 'effect';

const pinTab = (tabId: number) => Effect.promise(() => chrome.tabs.update(tabId, { pinned: true }));

const whisperingTabContentReadyMessageSchema = S.Struct({
	name: S.Literal('whisperingTabContentReady'),
	body: S.Struct({ tabId: S.Number }),
});

type WhisperingTabContentReadyMessage = S.Schema.Type<
	typeof whisperingTabContentReadyMessageSchema
>;

const isWhisperingTabContentReadyMessage = (
	message: unknown,
): message is WhisperingTabContentReadyMessage =>
	pipe(message, S.decodeUnknownEither(whisperingTabContentReadyMessageSchema), Either.isRight);

const waitForContentScriptLoaded = <T>(action: () => Promise<T>) =>
	Effect.async<number>((resume) => {
		chrome.runtime.onMessage.addListener(
			function contentReadyListener(message, sender, sendResponse) {
				if (!isWhisperingTabContentReadyMessage(message)) return;
				resume(Effect.succeed(message.body.tabId));
				chrome.runtime.onMessage.removeListener(contentReadyListener);
			},
		);
		// Perform your desired action here
		action();
	});

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

	const someDiscardedTabId = whisperingTabs[0]?.id;
	if (!someDiscardedTabId) return Option.none();
	const reloadedTabId = yield* waitForContentScriptLoaded(() =>
		chrome.tabs.reload(someDiscardedTabId),
	);
	yield* pinTab(reloadedTabId);
	return Option.some(reloadedTabId);
});

const createWhisperingTabId = Effect.gen(function* () {
	const newTabId = yield* waitForContentScriptLoaded(() =>
		chrome.tabs.create({ url: 'http://localhost:5173', active: false, pinned: true }),
	);
	return Option.some(newTabId);
});

export const getOrCreateWhisperingTabId = Effect.gen(function* () {
	const maybeFoundWhisperingId = yield* getWhisperingTabId;
	if (Option.isSome(maybeFoundWhisperingId)) return maybeFoundWhisperingId;
	const maybeCreatedWhisperingid = yield* createWhisperingTabId;
	return maybeCreatedWhisperingid;
});

const sendMessageToWhisperingContentScript = <R>(message: WhisperingMessage) =>
	Effect.gen(function* () {
		const maybeWhisperingTabId = yield* getOrCreateWhisperingTabId;
		if (Option.isNone(maybeWhisperingTabId)) {
			return yield* new WhisperingError({
				title: 'Whispering tab not found',
				description: `Could not find or create a Whispering tab to call "${message.name}" command`,
			});
		}
		const whisperingTabId = maybeWhisperingTabId.value;
		yield* Console.info(
			`Sending message to Whispering content script running on tab ${whisperingTabId}:`,
			message,
		);
		const response = yield* Effect.promise(() =>
			chrome.tabs.sendMessage<WhisperingMessage, R>(whisperingTabId, message),
		);
		yield* Console.info('Received response from Whispering content script:', response);
		return response;
	});

export const contentCommands = {
	getSettings: () => sendMessageToWhisperingContentScript<Settings>({ name: 'getSettings' }),
	setSettings: (settings: Settings) =>
		sendMessageToWhisperingContentScript<void>({ name: 'setSettings', body: { settings } }),
};
