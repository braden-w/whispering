import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { serviceWorkerCommands } from '~background/serviceWorkerCommands';

export type RequestBody = {};

export type ResponseBody = Result<number>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	serviceWorkerCommands.getActiveTabId.pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
