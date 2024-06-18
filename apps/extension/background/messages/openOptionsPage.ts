import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';

export const openOptionsPage = Effect.tryPromise({
	try: () => chrome.runtime.openOptionsPage(),
	catch: (error) =>
		new WhisperingError({
			title: 'Error opening options page',
			description: error instanceof Error ? error.message : `Unknown error: ${error}`,
			error,
		}),
});

export type RequestBody = {};

export type ResponseBody = Result<number>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, RequestBody> = (req, res) =>
	Effect.gen(function* () {
		yield* openOptionsPage;
	}).pipe(
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
