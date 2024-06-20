import { NotificationService, WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';

export const renderErrorAsNotification = (
	error: WhisperingError,
	options?: { notificationId?: string },
) =>
	Effect.gen(function* () {
		const { notify } = yield* NotificationService;
		yield* notify({
			id: options?.notificationId,
			title: error.title,
			description: error.description,
			action: error.action,
		});
		yield* Console.error({ ...error });
	});
