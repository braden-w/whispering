import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import { commands } from '~background/commands';
import type { BackgroundServiceWorkerResponse } from '~background/sendMessage';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		yield* commands.openOptionsPage;
		return true as const;
	}).pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
