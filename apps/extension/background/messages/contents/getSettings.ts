import { Schema as S } from '@effect/schema';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	WhisperingError,
	effectToResult,
	settingsSchema,
	type Result,
	type Settings,
} from '@repo/shared';
import { Effect } from 'effect';
import { SETTINGS_KEY, getOrCreateWhisperingTabId } from '~background/contentScriptCommands';
import { injectScript } from '~background/injectScript';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

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

export type RequestBody = {};

export type ResponseBody = Result<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
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
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
