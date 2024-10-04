import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { injectScript } from '~background/injectScript';
import { renderErrorAsNotification } from '~lib/errors';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import { NotificationServiceBgswLive } from '~lib/services/NotificationServiceBgswLive';

export type RequestBody = {};

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	req,
	res,
) =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTabId;
		yield* injectScript<undefined, []>({
			tabId: whisperingTabId,
			commandName: 'cancelRecording',
			func: () => {
				try {
					window.cancelRecording();
					return { isSuccess: true, data: undefined } as const;
				} catch (error) {
					return {
						isSuccess: false,
						error: {
							title: 'Unable to cancel recording',
							description:
								error instanceof Error
									? error.message
									: `Unknown error: ${error}`,
							error,
						},
					} as const;
				}
			},
			args: [],
		});
	}).pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
