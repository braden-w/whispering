import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Console, Effect } from 'effect';
import { getActiveTabId, type BackgroundServiceWorkerResponse } from '~background/sendMessage';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<number>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		yield* Console.info('BackgroundServiceWorker: getActiveTabId');
		const activeTabId = yield* getActiveTabId;
		return activeTabId;
	}).pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
