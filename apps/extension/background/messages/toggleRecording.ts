import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import { serviceWorkerCommands } from '~background/serviceWorkerCommands';
import type { Result } from '@repo/shared';

export type RequestBody = {};

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	serviceWorkerCommands.toggleRecording.pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
