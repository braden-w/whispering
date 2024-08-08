import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	WhisperingError,
	effectToResult,
	type ExternalMessage,
	type ExternalMessageNameToReturnType,
	type Result,
} from '@repo/shared';
import { Console, Effect } from 'effect';
import { getActiveTabId } from '~lib/background/external/getActiveTabId';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

const playSound = (sound: 'start' | 'stop' | 'cancel') =>
	Effect.gen(function* () {
		yield* Console.info('Playing sound', sound);
		const activeTabId = yield* getActiveTabId.pipe(
			Effect.mapError(
				(error) =>
					new WhisperingError({
						title: 'Failed to get active tab ID',
						description: 'Failed to get active tab ID to play sound',
						error,
					}),
			),
		);
		yield* Effect.tryPromise({
			try: () =>
				chrome.tabs.sendMessage(activeTabId, {
					message: 'playSound',
					sound,
				}),
			catch: (error) =>
				new WhisperingError({
					title: `Failed to play ${sound} sound`,
					description: `Failed to play ${sound} sound in active tab ${activeTabId}`,
					error,
				}),
		});
	}).pipe(
		// Silently catch playSound errors and log them to the console instead of render them as toast
		Effect.catchAll(Console.error)
	);

export type RequestBody = Extract<ExternalMessage, { name: 'external/playSound' }>['body'];

export type ResponseBody = Result<ExternalMessageNameToReturnType['external/playSound']>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.sound) {
			return yield* new WhisperingError({
				title: 'Error invoking playSound command',
				description: 'Sound must be provided in the request body of the message',
			});
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
