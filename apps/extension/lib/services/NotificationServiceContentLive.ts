import { sendToBackground } from '@plasmohq/messaging';
import { type NotificationService, tryAsync } from '@repo/shared';
import type * as ClearNotification from '~background/messages/whispering-extension/notifications/clear';
import type * as CreateNotification from '~background/messages/whispering-extension/notifications/create';

export const createNotificationServiceContentLive =
	(): NotificationService => ({
		notify: async (notifyOptions) => {
			const sendToCreateNotificationResult = await tryAsync({
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
			});
			if (!sendToCreateNotificationResult.ok)
				return sendToCreateNotificationResult;
			const createNotificationResult = sendToCreateNotificationResult.data;
			if (!createNotificationResult.ok) return createNotificationResult;
			return createNotificationResult;
		},
		clear: async (notificationId) => {
			const sendToClearNotificationResult = await tryAsync({
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
