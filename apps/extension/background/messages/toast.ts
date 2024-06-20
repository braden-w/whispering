import type { PlasmoMessaging } from '@plasmohq/messaging';
import {
	ToastService,
	WhisperingError,
	effectToResult,
	type Result,
	type ToastOptions,
} from '@repo/shared';
import { Console, Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody = { toastOptions: ToastOptions };

export type ResponseBody = Result<string>;

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
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
