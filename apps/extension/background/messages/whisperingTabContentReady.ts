import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';

export type RequestBody = { tabId: number };

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body || !body.tabId) {
			return yield* new WhisperingError({
				title: 'Error notifying background server worker of Whispering content script loaded state',
				description: 'Tab ID must be provided in the message message request body',
			});
		}
	}).pipe(
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
