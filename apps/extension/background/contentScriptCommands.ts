import { Schema as S } from '@effect/schema';
import {
	WHISPERING_URL,
	WHISPERING_URL_WILDCARD,
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
		chrome.tabs.query({ url: WHISPERING_URL_WILDCARD }),
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
		chrome.tabs.create({ url: WHISPERING_URL, active: false, pinned: true }),
	);
	return Option.some(newTabId);
});

export const getOrCreateWhisperingTabId = Effect.gen(function* () {
	const maybeFoundWhisperingId = yield* getWhisperingTabId;
	if (Option.isSome(maybeFoundWhisperingId)) return yield* maybeFoundWhisperingId;
	const maybeCreatedWhisperingid = yield* createWhisperingTabId;
	return yield* maybeCreatedWhisperingid;
}).pipe(
	Effect.mapError(
		(error) =>
			new WhisperingError({
				title: 'Whispering tab not found',
				description: 'Could not find or create a Whispering tab to call command',
				error,
			}),
	),
);

const SETTINGS_KEY = 'whispering-settings' as const;

const DEFAULT_VALUE = {
	isPlaySoundEnabled: true,
	isCopyToClipboardEnabled: true,
	isPasteContentsOnSuccessEnabled: true,
	selectedAudioInputDeviceId: '',
	currentLocalShortcut: 'space',
	currentGlobalShortcut: '',
	apiKey: '',
	outputLanguage: 'en',
} satisfies Settings;

export const contentCommands = {
	getSettings: () =>
		Effect.gen(function* () {
			const whisperingTabId = yield* getOrCreateWhisperingTabId;
			const [injectionResult] = yield* Effect.tryPromise({
				try: () =>
					chrome.scripting.executeScript<[typeof SETTINGS_KEY], Result<string | null>>({
						target: { tabId: whisperingTabId },
						world: 'MAIN',
						func: (settingsKey) => {
							try {
								const valueFromStorage = localStorage.getItem(settingsKey);
								return { isSuccess: true, data: valueFromStorage } as const;
							} catch (error) {
								return {
									isSuccess: false,
									error: {
										title: 'Unable to get Whispering settings',
										description:
											error instanceof Error
												? error.message
												: 'An error occurred while getting Whispering settings.',
										error,
									},
								} as const;
							}
						},
						args: [SETTINGS_KEY],
					}),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to execute "getSettings" script in Whispering tab',
						description: error instanceof Error ? error.message : `Unknown error: ${error}`,
						error,
					}),
			});
			yield* Console.info('Injection result "getSettings" script:', injectionResult);
			if (!injectionResult || !injectionResult.result) {
				return yield* new WhisperingError({
					title: 'Unable to "getSettings" in Whispering tab',
					description: 'The result of the script injection is undefined',
				});
			}
			const { result } = injectionResult;
			yield* Console.info('getSettings result:', result);
			const valueFromStorage = yield* resultToEffect(result);
			const isEmpty = valueFromStorage === null;
			if (isEmpty) return DEFAULT_VALUE;
			const settings = yield* S.decodeUnknown(S.parseJson(settingsSchema))(valueFromStorage).pipe(
				Effect.mapError(
					(error) =>
						new WhisperingError({
							title: 'Unable to parse Whispering settings',
							description: error instanceof Error ? error.message : `Unknown error: ${error}`,
							error,
						}),
				),
			);
			return settings;
		}),
	setSettings: (settings: Settings) =>
		Effect.gen(function* () {
			const whisperingTabId = yield* getOrCreateWhisperingTabId;
			const [injectionResult] = yield* Effect.tryPromise({
				try: () =>
					chrome.scripting.executeScript<[typeof SETTINGS_KEY, Settings], Result<Settings>>({
						target: { tabId: whisperingTabId },
						world: 'MAIN',
						func: (settingsKey, settings) => {
							try {
								localStorage.setItem(settingsKey, JSON.stringify(settings));
								return { isSuccess: true, data: settings } as const;
							} catch (error) {
								return {
									isSuccess: false,
									error: {
										title: 'Unable to set Whispering settings',
										description:
											error instanceof Error
												? error.message
												: 'An error occurred while setting Whispering settings.',
										error,
									},
								} as const;
							}
						},
						args: [SETTINGS_KEY, settings],
					}),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to execute "setSettings" script in Whispering tab',
						description: error instanceof Error ? error.message : `Unknown error: ${error}`,
						error,
					}),
			});
			yield* Console.info('Injection result "setSettings" script:', injectionResult);
			if (!injectionResult || !injectionResult.result) {
				return yield* new WhisperingError({
					title: 'Unable to "setSettings" in Whispering tab',
					description: 'The result of the script injection is undefined',
				});
			}
			const { result } = injectionResult;
			yield* Console.info('setSettings result:', result);
			const returnedSettings = yield* resultToEffect(result);
		}),
};
