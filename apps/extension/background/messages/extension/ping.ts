import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';

export type PingResult = WhisperingResult<'pong'>;

const handler: PlasmoMessaging.MessageHandler<never, PingResult> = async (
	_req,
	res,
) => {
	res.send(Ok('pong'));
};

export default handler;
