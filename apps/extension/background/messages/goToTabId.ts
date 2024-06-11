import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Console, Effect } from 'effect';
import type { Result } from '@repo/shared';
import { BackgroundServiceWorkerError } from '~lib/commands';

export type RequestBody = { tabId: number };

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		yield* Console.info('BackgroundServiceWorker: goToTabId');
		if (!body?.tabId) {
			return yield* new BackgroundServiceWorkerError({
				title: 'Error invoking goToTabId command',
				description: 'Tab id must be provided in the request body of the message',
			});
		}
		yield* Effect.promise(() => chrome.tabs.update(Number(body.tabId), { active: true }));
		return true as const;
	}).pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
