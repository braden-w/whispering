import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/errors';

export type RequestBody = {};

export type ResponseBody = Result<number>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
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
	}).pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
