import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import { Err, Ok } from '@repo/shared';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/notifications/create'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/notifications/create'>
>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async ({ body }, res) => {
	const createNotification = async (): Promise<Result<string>> => {
		if (!body?.notifyOptions) {
			return Err({
				_tag: 'WhisperingError',
				title: 'Error invoking notify command',
				description:
					'ToastOptions must be provided in the request body of the message',
				action: { type: 'none' },
			});
		}
		const { notify } = NotificationServiceBgswLive;
		const notifyResult = await notify(body.notifyOptions);
		return notifyResult;
	};
	return res.send(await createNotification());
};

export default handler;
