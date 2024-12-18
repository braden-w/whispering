import { sendToBackground } from '@plasmohq/messaging';
import {
	NotificationService,
	WhisperingError,
	resultToEffect,
} from '@repo/shared';
import { Console, Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';
import type * as ClearNotification from '~background/messages/whispering-extension/notifications/clear';
import type * as CreateNotification from '~background/messages/whispering-extension/notifications/create';

export const NotificationServiceContentLive = Layer.succeed(
	NotificationService,
	NotificationService.of({
		notify: (notifyOptions) =>
			Effect.tryPromise({
				try: () =>
					sendToBackground<
						CreateNotification.RequestBody,
						CreateNotification.ResponseBody
					>({
						name: 'whispering-extension/notifications/create',
						body: { notifyOptions },
					}),
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: 'Unable to notify via background service worker',
					description:
						'There was likely an issue sending the message to the background service worker from the popup.',
					action: {
						type: 'more-details',
						error,
					},
				}),
			}).pipe(
				Effect.flatMap(resultToEffect),
				Effect.tapError((error) => Console.error({ ...error })),
				Effect.catchAll(() => Effect.succeed(notifyOptions.id ?? nanoid())),
			),
		clear: (notificationId) =>
			Effect.tryPromise({
				try: () =>
					sendToBackground<
						ClearNotification.RequestBody,
						ClearNotification.ResponseBody
					>({
						name: 'whispering-extension/notifications/clear',
						body: { notificationId },
					}),
				catch: (error) => ({
					_tag: 'WhisperingError',
					title: 'Unable to clear notification via background service worker',
					description:
						'There was likely an issue sending the message to the background service worker from the popup.',
					action: {
						type: 'more-details',
						error,
					},
				}),
			}).pipe(Effect.catchAll((error) => Console.error({ ...error }))),
	}),
);
