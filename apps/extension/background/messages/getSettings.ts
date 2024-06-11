import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import {
	serviceWorkerCommands,
	type BackgroundServiceWorkerResponse,
} from '~background/serviceWorkerCommands';
import type { Settings } from '~lib/services/local-storage';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	serviceWorkerCommands.getSettings.pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
