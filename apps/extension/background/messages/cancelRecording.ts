import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Option, Effect, Console } from 'effect';
import { getOrCreateWhisperingTabId } from '~background/contentScriptCommands';
import { renderErrorAsToast } from '~lib/errors';
import { WhisperingError, effectToResult } from '@repo/shared';

declare const window: {
	toggleRecording: () => void;
	cancelRecording: () => void;
} & Window;

export type RequestBody = {};

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const whisperingTabId = yield* getOrCreateWhisperingTabId;
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript({
					target: { tabId: whisperingTabId },
					world: 'MAIN',
					func: () => window.cancelRecording(),
				}),
			catch: (error) =>
				new WhisperingError({
					title: 'Unable to execute "cancelRecording" script in Whispering tab',
					description: error instanceof Error ? error.message : `Unknown error: ${error}`,
					error,
				}),
		});
		yield* Console.info('Injection result "cancelRecording" script:', injectionResult);
	}).pipe(
		Effect.tapError(renderErrorAsToast('bgsw')),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
