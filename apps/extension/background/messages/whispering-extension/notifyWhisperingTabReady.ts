import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import { Ok } from '@repo/shared';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/notifyWhisperingTabReady'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/notifyWhisperingTabReady'>
>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	{ body },
	res,
) => {
	res.send(Ok(undefined));
};

export default handler;
