import type { PlasmoMessaging } from '@plasmohq/messaging';
import { Effect } from 'effect';
import { serviceWorkerCommands } from '~background/serviceWorkerCommands';
import type { Result } from '@repo/shared';
import { BackgroundServiceWorkerError } from '~lib/commands';
import type { Settings } from '~lib/services/local-storage';

export type RequestBody = { settings: Settings };

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.settings) {
			return yield* new BackgroundServiceWorkerError({
				title: 'Error invoking setSettings command',
				description: 'Settings must be provided in the request body of the message',
			});
		}
		yield* serviceWorkerCommands.setSettings(body.settings);
		return true as const;
	}).pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
