import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Console, Effect } from 'effect';
import { BackgroundServiceWorkerError, type BackgroundServiceWorkerResponse } from '~background';

export const getActiveTabId = Effect.gen(function* () {
	const activeTabs = yield* Effect.tryPromise({
		try: () => chrome.tabs.query({ active: true, currentWindow: true }),
		catch: (error) =>
			new BackgroundServiceWorkerError({
				title: 'Error getting active tabs',
				error: error,
			}),
	});
	const firstActiveTab = activeTabs[0];
	if (!firstActiveTab.id) {
		return yield* new BackgroundServiceWorkerError({ title: 'No active tab found' });
	}
	return firstActiveTab.id;
});

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
