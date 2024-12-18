import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	type ExternalMessageBody,
	type ExternalMessageReturnType,
	type Result,
	WhisperingError,
	effectToResult,
} from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { getActiveTabId } from '~lib/getActiveTabId';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

const playSound = (sound: 'start' | 'stop' | 'cancel') =>
	Effect.gen(function* () {
		yield* Console.info('Playing sound', sound);
		const activeTabId = yield* getActiveTabId.pipe(
			Effect.mapError((error) => ({
				_tag: 'WhisperingError',
				title: 'Failed to get active tab ID',
				description: 'Failed to get active tab ID to play sound',
				action: { type: 'more-details', error },
			})),
		);
		yield* Effect.tryPromise({
			try: () =>
				chrome.tabs.sendMessage(activeTabId, {
					message: 'playSound',
					sound,
				}),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: `Failed to play ${sound} sound`,
				description: `Failed to play ${sound} sound in active tab ${activeTabId}`,
				action: { type: 'more-details', error },
			}),
		});
	}).pipe(
		// Silently catch playSound errors and log them to the console instead of render them as toast
		Effect.catchAll(Console.error),
	);

export type RequestBody = ExternalMessageBody<'whispering-extension/playSound'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/playSound'>
>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	{ body },
	res,
) =>
	Effect.gen(function* () {
		if (!body?.sound) {
			return yield* {
				_tag: 'WhisperingError',
				title: 'Error invoking playSound command',
				description:
					'Sound must be provided in the request body of the message',
				action: { type: 'none' },
			};
		}
		yield* playSound(body.sound);
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
