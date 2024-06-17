import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result, Settings } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { sendMessageToWhisperingContentScript } from '~background/sendMessage';
import { renderErrorAsToast } from '~lib/errors';

export type RequestBody = { settings: Settings };

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
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
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
