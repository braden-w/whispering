import { Schema as S } from '@effect/schema';
import {
	WHISPERING_URL,
	WHISPERING_URL_WILDCARD,
	WhisperingError,
	externalMessageSchema,
	settingsSchema,
	type Settings,
} from '@repo/shared';
import { Effect, Either, Option, pipe } from 'effect';
import { injectScript } from './injectScript';

const pinTab = (tabId: number) => Effect.promise(() => chrome.tabs.update(tabId, { pinned: true }));

const notifyWhisperingTabReadyMessageSchema = externalMessageSchema.members['6'];

type NotifyWhisperingTabReadyMessage = S.Schema.Type<typeof notifyWhisperingTabReadyMessageSchema>;

const isNotifyWhisperingTabReadyMessage = (
	message: unknown,
): message is NotifyWhisperingTabReadyMessage =>
	pipe(message, S.decodeUnknownEither(notifyWhisperingTabReadyMessageSchema), Either.isRight);

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
				const isMessageValid = specificTabId === undefined || message.body.tabId === specificTabId;
				if (!isMessageValid) return;
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
			const valueFromStorage = yield* injectScript<string | null, [typeof SETTINGS_KEY]>({
				tabId: whisperingTabId,
				commandName: 'setSettings',
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
			});
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
			const returnedSettings = yield* injectScript<Settings, [typeof SETTINGS_KEY, Settings]>({
				tabId: whisperingTabId,
				commandName: 'setSettings',
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
			});
		}),
};
