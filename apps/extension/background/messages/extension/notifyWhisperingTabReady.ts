import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';

export type NotifyWhisperingTabReadyMessage = {
	tabId: number;
};

export type NotifyWhisperingTabReadyResult = WhisperingResult<undefined>;

const handler: PlasmoMessaging.MessageHandler<
	NotifyWhisperingTabReadyMessage,
	NotifyWhisperingTabReadyResult
> = ({ body }, res) => {
	res.send(Ok(undefined));
};

export default handler;
