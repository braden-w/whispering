import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import { serviceWorkerCommands } from '~background/serviceWorkerCommands';
import type { BackgroundServiceWorkerResponse } from '~background/serviceWorkerCommands';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	serviceWorkerCommands.toggleRecording.pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
