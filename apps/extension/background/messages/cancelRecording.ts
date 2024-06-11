import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Console, Effect } from 'effect';
import type { BackgroundServiceWorkerResponse } from '~background/sendMessage';
import { getOrCreateWhisperingTabId } from '~background/sendMessage';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		yield* Console.info('BackgroundServiceWorker: cancelRecording');
		const tabId = yield* getOrCreateWhisperingTabId;
		chrome.scripting.executeScript({
			target: { tabId },
			world: 'MAIN',
			func: () => window.cancelRecording(),
		});
		return true as const;
	}).pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
