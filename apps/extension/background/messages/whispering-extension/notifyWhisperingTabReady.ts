import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';

const handler: PlasmoMessaging.MessageHandler<
	void,
	WhisperingResult<undefined>
> = ({ body }, res) => {
	res.send(Ok(undefined));
};

export default handler;
