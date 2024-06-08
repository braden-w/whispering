import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Console, Effect } from 'effect';
import { sendMessageToWhisperingContentScript, type BackgroundServiceWorkerResponse } from '~background/sendMessage';
import type { Settings } from '~lib/services/local-storage';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		yield* Console.info('BackgroundServiceWorker: getSettings');
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
