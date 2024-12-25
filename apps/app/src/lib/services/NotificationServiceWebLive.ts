import { extension } from '@repo/extension';
import type { NotificationService } from '@repo/shared';

export const createNotificationServiceWeb = (): NotificationService => {
	return {
		notify: async (notifyOptions) => {
			const sendMessageToExtensionResult = await extension.createNotification({
				notifyOptions,
			});
			if (!sendMessageToExtensionResult.ok) return sendMessageToExtensionResult;
			const createNotificationResult = sendMessageToExtensionResult.data;
			return createNotificationResult;
		},
		clear: async (notificationId: string) => {
			const sendMessageToExtensionResult = await extension.clearNotification({
				notificationId,
			});
			if (!sendMessageToExtensionResult.ok) return sendMessageToExtensionResult;
			const clearNotificationResult = sendMessageToExtensionResult.data;
			return clearNotificationResult;
		},
	};
};

export const NotificationServiceWebLive = createNotificationServiceWeb();
