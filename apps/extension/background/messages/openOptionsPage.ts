import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { BackgroundServiceWorkerError } from '~lib/errors';

export const openOptionsPage = Effect.tryPromise({
	try: () => chrome.runtime.openOptionsPage(),
	catch: (error) =>
		new BackgroundServiceWorkerError({
			title: 'Error opening options page',
			description: error instanceof Error ? error.message : undefined,
			error,
		}),
});

export type RequestBody = {};

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		yield* openOptionsPage;
		return true as const;
	}).pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
