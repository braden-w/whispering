import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { NotificationService } from '@repo/shared';
import { Console, Effect, Layer } from 'effect';
import { nanoid } from 'nanoid/non-secure';

export const NotificationServiceWebLive = Layer.succeed(
	NotificationService,
	NotificationService.of({
		notify: (notifyOptions) =>
			Effect.gen(function* () {
				const id =
					(yield* sendMessageToExtension({
						name: 'external/notifications/create',
						body: { notifyOptions },
					})) ?? nanoid();
				return id;
			}).pipe(
				Effect.tapError((error) => Console.error({ ...error })),
				Effect.catchAll(() => Effect.succeed(nanoid())),
			),
		clear: (notificationId: string) =>
			Effect.gen(function* () {
				yield* sendMessageToExtension({
					name: 'external/notifications/clear',
					body: { notificationId },
				});
			}).pipe(Effect.catchAll((error) => Console.error({ ...error }))),
	}),
);
