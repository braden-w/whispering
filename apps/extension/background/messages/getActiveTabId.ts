import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import {
	serviceWorkerCommands,
	type BackgroundServiceWorkerResponse,
} from '~background/serviceWorkerCommands';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<number>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	serviceWorkerCommands.getActiveTabId.pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
