import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	WhisperingResult,
} from '@repo/shared';
import { WhisperingErr } from '@repo/shared';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/notifications/create'>;

export type ResponseBody = WhisperingResult<
	ExternalMessageReturnType<'whispering-extension/notifications/create'>
>;

const handler: PlasmoMessaging.MessageHandler<
	RequestBody,
	ResponseBody
> = async ({ body }, res) => {
	const createNotification = async (): Promise<WhisperingResult<string>> => {
		if (!body?.notifyOptions) {
			return WhisperingErr({
				_tag: 'WhisperingError',
				title: 'Error invoking notify command',
				description:
					'ToastOptions must be provided in the request body of the message',
				action: { type: 'none' },
			});
		}
		const notifyResult = await NotificationServiceBgswLive.notify(
			body.notifyOptions,
		);
		return notifyResult;
	};
	res.send(await createNotification());
};

export default handler;
