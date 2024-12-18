import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import type { NotificationService } from '@repo/shared';
import { nanoid } from 'nanoid/non-secure';

export const createNotificationServiceWeb = (): NotificationService => {
	return {
		notify: async (notifyOptions) => {
			const sendMessageToExtensionResult = await sendMessageToExtension({
				name: 'whispering-extension/notifications/create',
				body: { notifyOptions },
			});
			if (!sendMessageToExtensionResult.ok) return sendMessageToExtensionResult;
			const id = sendMessageToExtensionResult.data ?? nanoid();
			return id;
		},
		clear: (notificationId: string) =>
			sendMessageToExtension({
				name: 'whispering-extension/notifications/clear',
				body: { notificationId },
			}),
	};
};

export const NotificationServiceWebLive = createNotificationServiceWeb();
