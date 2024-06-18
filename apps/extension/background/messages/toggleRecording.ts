import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Console, Effect } from 'effect';
import { getOrCreateWhisperingTabId } from '~background/contentScriptCommands';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

declare const window: {
	toggleRecording: () => void;
	cancelRecording: () => void;
} & Window;

export type RequestBody = {};

export type ResponseBody = Result<void>;

export const toggleRecording = Effect.gen(function* () {
	const whisperingTabId = yield* getOrCreateWhisperingTabId;
	yield* Console.info('Whispering tab ID:', whisperingTabId);
	const [injectionResult] = yield* Effect.tryPromise({
		try: () =>
			chrome.scripting.executeScript({
				target: { tabId: whisperingTabId },
				world: 'MAIN',
				func: () => window.toggleRecording(),
			}),
		catch: (error) =>
			new WhisperingError({
				title: 'Unable to execute "toggleRecording" script in Whispering tab',
				description: error instanceof Error ? error.message : `Unknown error: ${error}`,
				error,
			}),
	});
	yield* Console.info('Injection result "toggleRecording" script:', injectionResult);
});

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	toggleRecording.pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
