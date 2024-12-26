import { Ok, trySync } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingErr, type WhisperingResult } from '@repo/shared';

export type ClearNotificationMessage = {
	notificationId: string;
};
export type ClearNotificationResult = WhisperingResult<void>;

async function clearNotification(
	notificationId: string,
): Promise<WhisperingResult<void>> {
	const clearResult = trySync({
		try: () => chrome.notifications.clear(notificationId),
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
}

const handler: PlasmoMessaging.MessageHandler<
	ClearNotificationMessage,
	ClearNotificationResult
> = async ({ body }, res) => {
	if (!body?.notificationId) {
		res.send(
			WhisperingErr({
				title: 'Error invoking clearNotification command',
				description:
					'ClearNotification must be provided notificationId in the request body of the message',
			}),
		);
		return;
	}
	res.send(await clearNotification(body.notificationId));
};

export default handler;
