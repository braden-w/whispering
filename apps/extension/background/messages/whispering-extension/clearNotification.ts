import { Ok, trySync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';

export type ClearNotificationMessage = {
	notificationId: string;
};
export type ClearNotificationResult = WhisperingResult<void>;

const handler: PlasmoMessaging.MessageHandler<
	ClearNotificationMessage,
	ClearNotificationResult
> = async ({ body }, res) => {
	const clearNotification = async (): Promise<WhisperingResult<void>> => {
		if (!body?.notificationId) {
			return WhisperingErr({
				title: 'Error invoking clearNotification command',
				description:
					'ClearNotification must be provided notificationId in the request body of the message',
			});
		}
		const clearResult = trySync({
			try: () => chrome.notifications.clear(body.notificationId),
			mapErr: (error) =>
				WhisperingErr({
					title: 'Error invoking clearNotification command',
					description:
						'There was an error clearing the notification in the background service worker.',
					action: { type: 'more-details', error },
				}),
		});
		if (!clearResult.ok) return clearResult;
		return Ok(undefined);
	};
	res.send(await clearNotification());
};

export default handler;
