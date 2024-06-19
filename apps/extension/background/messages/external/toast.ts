import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result, ToastOptions } from '@repo/shared';
import { ToastService, WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

const toast = (toastOptions: ToastOptions) =>
	Effect.gen(function* () {
		const { toast } = yield* ToastService;
		return yield* toast(toastOptions);
	}).pipe(Effect.provide(ToastServiceBgswLive));

export type RequestBody = { toastOptions: ToastOptions };

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.toastOptions) {
			return yield* new WhisperingError({
				title: 'Error invoking toast command',
				description: 'ToastOptions must be provided in the request body of the message',
			});
		}
		yield* toast(body.toastOptions);
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
