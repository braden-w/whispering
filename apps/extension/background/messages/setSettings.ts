import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { sendMessageToWhisperingContentScript } from '~background/sendMessage';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';
import type { Settings } from '~lib/services/local-storage';

const handler: PlasmoMessaging.MessageHandler<{ settings: Settings }, Result<true>> = (
	{ body },
	res,
) =>
	Effect.gen(function* () {
		if (!body || !body.settings) {
			return yield* new WhisperingError({
				title: 'Error setting Whispering settings',
				description: 'Settings must be provided in the message request body',
			});
		}
		yield* sendMessageToWhisperingContentScript<void>({
			commandName: 'setSettings',
			settings: body.settings,
		});
		return true as const;
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
