import { Ok } from '@epicenterhq/result';
import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { WhisperingResult } from '@repo/shared';

export type NotifyWhisperingTabReadyMessage = undefined;

export type NotifyWhisperingTabReadyResult = WhisperingResult<undefined>;

const handler: PlasmoMessaging.MessageHandler<
	NotifyWhisperingTabReadyMessage,
	NotifyWhisperingTabReadyResult
> = (_, res) => {
	res.send(Ok(undefined));
};

export default handler;
