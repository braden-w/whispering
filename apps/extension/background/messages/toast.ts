import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	ToastService,
	WhisperingError,
	effectToResult,
	type Result,
	type ToastOptions,
} from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

export type RequestBody = { toastOptions: ToastOptions };

export type ResponseBody = Result<number | string>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		yield* Console.info('BackgroundServiceWorker: toast');
		if (!body?.toastOptions) {
			return yield* new WhisperingError({
				title: 'Error invoking toast command',
				description: 'Toast options must be provided in the request body of the message',
			});
		}
		const { toast } = yield* ToastService;
		const toastId = yield* toast(body.toastOptions);
		return toastId;
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
