import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { ExternalMessage, ExternalMessageNameToReturnType, Result } from '@repo/shared';
import { NotificationService, WhisperingError, effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { renderErrorAsNotification } from '~lib/errors';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody = Extract<
	ExternalMessage,
	{ name: 'external/notifications/clear' }
>['body'];

export type ResponseBody = Result<ExternalMessageNameToReturnType['external/notifications/clear']>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.notificationId) {
			return yield* new WhisperingError({
				title: 'Error invoking notify command',
				description:
					'Notify/clear must be provided notificationId in the request body of the message',
			});
		}
		const notificationService = yield* NotificationService;
		return yield* notificationService.clear(body.notificationId);
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
