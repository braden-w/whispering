import type { PlasmoMessaging } from '@plasmohq/messaging';
import type {
	ExternalMessageBody,
	ExternalMessageReturnType,
	Result,
} from '@repo/shared';
import {
	NotificationService,
	WhisperingError,
	effectToResult,
} from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody =
	ExternalMessageBody<'whispering-extension/notifications/create'>;

export type ResponseBody = Result<
	ExternalMessageReturnType<'whispering-extension/notifications/create'>
>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	{ body },
	res,
) =>
	Effect.gen(function* () {
		if (!body?.notifyOptions) {
			return yield* {
				_tag: 'WhisperingError',
				title: 'Error invoking notify command',
				description:
					'ToastOptions must be provided in the request body of the message',
				action: { type: 'none' },
			};
		}
		const { notify } = yield* NotificationService;
		return yield* notify(body.notifyOptions);
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
