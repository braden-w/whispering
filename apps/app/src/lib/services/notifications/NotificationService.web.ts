import { Ok } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import type { NotificationService } from './NotificationService';

export function createNotificationServiceWeb(): NotificationService {
	return {
		notify: async (notifyOptions) => {
			const createNotificationResult = await extension.createNotification({
				notifyOptions,
			});
			if (!createNotificationResult.ok) return createNotificationResult;
			const notificationId = createNotificationResult.data;
			return Ok(notificationId);
		},
		clear: async (notificationId: string) => {
			const clearNotificationResult = await extension.clearNotification({
				notificationId,
			});
			if (!clearNotificationResult.ok) return clearNotificationResult;
			return Ok(undefined);
		},
	};
}
