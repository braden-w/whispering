import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import {
	sendMessageToWhisperingContentScript,
	type BackgroundServiceWorkerResponse,
} from '~background';
import type { Settings } from '~contents/whispering';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const settings = yield* sendMessageToWhisperingContentScript({
			commandName: 'getSettings',
			args: [],
		});
		return settings;
	}).pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
