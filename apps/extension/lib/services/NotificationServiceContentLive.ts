import { sendToBackground } from '@plasmohq/messaging';
import { WhisperingErr, type NotificationService } from '@repo/shared';
import type * as ClearNotification from '~background/messages/whispering-extension/notifications/clear';
import type * as CreateNotification from '~background/messages/whispering-extension/notifications/create';
import { tryAsync } from '@epicenterhq/result';

export const createNotificationServiceContentLive =
	(): NotificationService => ({
		async notify(notifyOptions) {
			const sendToCreateNotificationResult = await tryAsync({
				try: () =>
					sendToBackground<
						CreateNotification.RequestBody,
						CreateNotification.ResponseBody
					>({
						name: 'whispering-extension/notifications/create',
						body: { notifyOptions },
					}),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Unable to notify via background service worker',
						description:
							'There was likely an issue sending the message to the background service worker from the popup.',
						action: {
							type: 'more-details',
							error,
						},
					}),
			});
			if (!sendToCreateNotificationResult.ok)
				return sendToCreateNotificationResult;
			const createNotificationResult = sendToCreateNotificationResult.data;
			if (!createNotificationResult.ok) return createNotificationResult;
			return createNotificationResult;
		},
		async clear(notificationId) {
			const sendToClearNotificationResult = await tryAsync({
				try: () =>
					sendToBackground<
						ClearNotification.RequestBody,
						ClearNotification.ResponseBody
					>({
						name: 'whispering-extension/notifications/clear',
						body: { notificationId },
					}),
				mapErr: (error) =>
					WhisperingErr({
						title: 'Unable to clear notification via background service worker',
						description:
							'There was likely an issue sending the message to the background service worker from the popup.',
						action: {
							type: 'more-details',
							error,
						},
					}),
			});
			if (!sendToClearNotificationResult.ok)
				return sendToClearNotificationResult;
			const clearNotificationResult = sendToClearNotificationResult.data;
			if (!clearNotificationResult.ok) return clearNotificationResult;
			return clearNotificationResult;
		},
	});

export const NotificationServiceContentLive =
	createNotificationServiceContentLive();
