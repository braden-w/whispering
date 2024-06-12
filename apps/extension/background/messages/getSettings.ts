import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { sendMessageToWhisperingContentScript } from '~background/sendMessage';
import { renderErrorAsToast } from '~lib/errors';
import type { Settings } from '~lib/services/local-storage';

export type RequestBody = {};

export type ResponseBody = Result<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const settings = yield* sendMessageToWhisperingContentScript<Settings>({
			commandName: 'getSettings',
		});
		return settings;
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
