import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

const handler: PlasmoMessaging.MessageHandler<
	{ notificationId: string },
	WhisperingResult<void>
> = async ({ body }, res) => {
	const clearNotification = async () => {
		if (!body?.notificationId) {
			return WhisperingErr({
				title: 'Error invoking notify command',
				description:
					'Notify/clear must be provided notificationId in the request body of the message',
			});
		}
		const clearResult = await NotificationServiceBgswLive.clear(
			body.notificationId,
		);
		if (!clearResult.ok) return clearResult;
		return Ok(undefined);
	};
	res.send(await clearNotification());
};

export default handler;
