import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	WhisperingResult,
} from '@repo/shared';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/notifyWhisperingTabReady'>;

export type ResponseBody = WhisperingResult<
	ExternalMessageReturnType<'whispering-extension/notifyWhisperingTabReady'>
>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	{ body },
	res,
) => {
	res.send(Ok(undefined));
};

export default handler;
