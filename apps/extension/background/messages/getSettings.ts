import type { PlasmoMessaging } from '@plasmohq/messaging';
import { effectToResult, type Result, type Settings } from '@repo/shared';
import { Effect } from 'effect';
import { sendMessageToWhisperingContentScript } from '~background/sendMessage';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

export type RequestBody = {};

export type ResponseBody = Result<Settings>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const settings = yield* sendMessageToWhisperingContentScript<Settings>({
			commandName: 'getSettings',
		});
		return settings;
	}).pipe(
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
