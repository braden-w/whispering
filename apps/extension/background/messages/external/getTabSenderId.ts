import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingError, effectToResult, type Result } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

export type RequestBody = {};

export type ResponseBody = Result<number>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		if (!req.sender?.tab?.id) {
			return yield* new WhisperingError({
				title: 'Failed to get tab ID of sender tab',
				description: 'Please try again.',
			});
		}
		return req.sender?.tab?.id;
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
