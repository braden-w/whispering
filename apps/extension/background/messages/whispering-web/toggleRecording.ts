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

export const toggleRecording = Effect.gen(function* () {
	const whisperingTabId = yield* getOrCreateWhisperingTabId;
	yield* injectScript<undefined, []>({
		tabId: whisperingTabId,
		commandName: 'toggleRecording',
		func: () => {
			try {
				window.toggleRecording();
				return { ok: true, data: undefined } as const;
			} catch (error) {
				return {
					ok: false,
					error: {
						title: 'Unable to toggle recording',
						description:
							'There was an error toggling the recording. Please try again.',
						action: {
							type: 'more-details',
							error,
						},
					},
				} as const;
			}
		},
		args: [],
	});
});

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (
	req,
	res,
) =>
	toggleRecording.pipe(
		Effect.tapError(renderErrorAsNotification),
		Effect.provide(NotificationServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
