import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';

export type RequestBody = { tabId: number };

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body || !body.tabId) {
			return yield* new WhisperingError({
				title: 'Error notifying background server worker of Whispering content script loaded state',
				description: 'Tab ID must be provided in the message message request body',
			});
		}
		return true as const;
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
