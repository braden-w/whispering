import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import { BackgroundServiceWorkerError, type BackgroundServiceWorkerResponse } from '~background';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		yield* Effect.tryPromise({
			try: () => chrome.runtime.openOptionsPage(),
			catch: (error) =>
				new BackgroundServiceWorkerError({
					title: 'Error opening options page',
					description: error instanceof Error ? error.message : undefined,
					error,
				}),
		});
		return true as const;
	}).pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runSync,
	);

export default handler;
