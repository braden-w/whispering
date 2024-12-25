import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	WhisperingResult,
} from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/notifications/clear'>;

export type ResponseBody =
	ExternalMessageReturnType<'whispering-extension/notifications/clear'>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
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
