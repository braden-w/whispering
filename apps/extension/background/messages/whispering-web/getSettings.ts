import { Schema } from '@effect/schema';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	type Result,
	type Settings,
	WhisperingError,
	effectToResult,
	getDefaultSettings,
	settingsSchema,
} from '@repo/shared';
import { Effect } from 'effect';
import { injectScript } from '~background/injectScript';
import { renderErrorAsNotification } from '~lib/errors';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';
import { STORAGE_KEYS } from '~lib/services/extension-storage';

export type RequestBody = {};

export type ResponseBody = Result<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	req,
	res,
) =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTabId;
		const valueFromStorage = yield* injectScript<
			string | null,
			[typeof STORAGE_KEYS.SETTINGS]
		>({
			tabId: whisperingTabId,
			commandName: 'getSettings',
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
			args: [STORAGE_KEYS.SETTINGS],
		});
		const isEmpty = valueFromStorage === null;
		if (isEmpty) return getDefaultSettings('extension');
		const settings = yield* Schema.decodeUnknown(
			Schema.parseJson(settingsSchema),
		)(valueFromStorage).pipe(
			Effect.mapError(
				(error) =>
					new WhisperingError({
						title: 'Unable to parse Whispering settings',
						description:
							error instanceof Error
								? error.message
								: `Unknown error: ${error}`,
						error,
					}),
			),
		);
		return settings;
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
