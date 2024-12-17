import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { injectScript } from '~background/injectScript';
import { renderErrorAsNotification } from '~lib/errors';
import { getActiveTabId } from '~lib/getActiveTabId';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';
import {
	STORAGE_KEYS,
	extensionStorageService,
} from '~lib/services/extension-storage';

const setClipboardText = (text: string): Effect.Effect<void, WhisperingError> =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		yield* extensionStorageService[
			STORAGE_KEYS.LATEST_RECORDING_TRANSCRIBED_TEXT
		].set(text);
		yield* injectScript<string, [string]>({
			tabId: activeTabId,
			commandName: 'setClipboardText',
			func: (text) => {
				try {
					navigator.clipboard.writeText(text);
					return { ok: true, data: text } as const;
				} catch (error) {
					return {
						ok: false,
						error: {
							title:
								'Unable to copy transcribed text to clipboard in active tab',
							description:
								'There was an error writing to the clipboard using the browser Clipboard API. Please try again.',
							action: { type: 'more-details', error },
						},
					} as const;
				}
			},
			args: [text],
		});
	}).pipe(
		Effect.catchTags({
			GetActiveTabIdError: () =>
				new WhisperingError({
					title:
						'Unable to get active tab ID to copy transcribed text to clipboard',
					description:
						'Please go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
					action: { type: 'none' },
				}),
		}),
	);

export type RequestBody =
	ExternalMessageBody<'whispering-extension/setClipboardText'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/setClipboardText'>
>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	{ body },
	res,
) =>
	Effect.gen(function* () {
		if (!body?.transcribedText) {
			return yield* new WhisperingError({
				title: 'Error invoking setClipboardText command',
				description: 'Text must be provided in the request body of the message',
				action: { type: 'none' },
			});
		}
		yield* setClipboardText(body.transcribedText);
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
