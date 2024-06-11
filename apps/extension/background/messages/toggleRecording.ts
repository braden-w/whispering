import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Console, Effect, Either } from 'effect';
import type { BackgroundServiceWorkerResponse } from '~background/sendMessage';
import { getOrCreateWhisperingTabId } from '~background/sendMessage';
import toggleRecording from '../toggleRecording';
import { commands } from '~background/commands';

export type RequestBody = {};

export type ResponseBody = BackgroundServiceWorkerResponse<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		yield* commands.toggleRecording;
		return true as const;
	}).pipe(
		Effect.map((data) => ({ data, error: null })),
		Effect.catchAll((error) => Effect.succeed({ data: null, error })),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
