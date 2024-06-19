import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { effectToResult } from '@repo/shared';
import { Effect } from 'effect';
import { getOrCreateWhisperingTabId } from '~background/contentScriptCommands';
import { injectScript } from '~background/injectScript';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

declare const window: {
	toggleRecording: () => void;
	cancelRecording: () => void;
} & Window;

export type RequestBody = {};

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
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
							description: error instanceof Error ? error.message : `Unknown error: ${error}`,
							error,
						},
					} as const;
				}
			},
			args: [],
		});
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
