import type { WhisperingResult } from '@repo/shared';
import { NotificationServiceContentLive } from './services/NotificationServiceContentLive';

export const renderErrorAsNotification = (
	maybeError: WhisperingResult<unknown>,
	options?: { notificationId?: string },
) => {
	if (maybeError.ok) return;
	const error = maybeError.error;
	const { notify } = NotificationServiceContentLive;
	notify({
		id: options?.notificationId,
		title: error.title,
		description: error.description,
		action: error.action,
	});
	console.error({ ...error });
};
