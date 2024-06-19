import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result, Settings } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { contentCommands } from '~background/contentScriptCommands';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

export type RequestBody = { settings: Settings };

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body || !body.settings) {
			return yield* new WhisperingError({
				title: 'Error setting Whispering settings',
				description: 'Settings must be provided in the message request body',
			});
		}
		yield* contentCommands.setSettings(body.settings);
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
