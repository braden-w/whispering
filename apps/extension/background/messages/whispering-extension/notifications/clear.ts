import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import { Err, Ok } from '@repo/shared';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/notifications/clear'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/notifications/clear'>
>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async ({ body }, res) => {
	const clearNotification = async () => {
		if (!body?.notificationId) {
			return Err({
				_tag: 'WhisperingError',
				title: 'Error invoking notify command',
				description:
					'Notify/clear must be provided notificationId in the request body of the message',
				action: { type: 'none' },
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
