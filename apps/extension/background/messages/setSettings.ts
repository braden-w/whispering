import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import {
	BackgroundServiceWorkerError,
	sendMessageToWhisperingContentScript,
	type BackgroundServiceWorkerResponse,
} from '~background';
import type { Settings } from '~contents/whispering';

export type RequestBody = { settings: Settings };

export type ResponseBody = BackgroundServiceWorkerResponse<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.settings)
			return yield* new BackgroundServiceWorkerError({
				title: 'Error invoking setSettings command',
				description: 'Settings must be provided in the request body of the message',
			});
		yield* sendMessageToWhisperingContentScript({
			commandName: 'setSettings',
			args: [body.settings],
		});
		return true;
	}).pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
