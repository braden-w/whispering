import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingError, effectToResult, type Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';

export type RequestBody = { tabId: number };

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		yield* Console.info('BackgroundServiceWorker: goToTabId');
		if (!body?.tabId) {
			return yield* new WhisperingError({
				title: 'Error invoking goToTabId command',
				description: 'Tab id must be provided in the request body of the message',
			});
		}
		yield* Effect.tryPromise({
			try: () => chrome.tabs.update(Number(body.tabId), { active: true }),
			catch: (error) =>
				new WhisperingError({
					title: `Error going to tab ${body.tabId}`,
					description: error instanceof Error ? error.message : `Unknown error: ${error}`,
					error,
				}),
		});
		return true as const;
	}).pipe(
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
