import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Console, Effect, Option } from 'effect';
import { getOrCreateWhisperingTabId } from '~background/sendMessage';
import { renderErrorAsToast } from '~lib/errors';

declare const window: {
	toggleRecording: () => void;
	cancelRecording: () => void;
} & Window;

export const toggleRecording = Effect.gen(function* () {
	const maybeWhisperingTabId = yield* getOrCreateWhisperingTabId;
	if (Option.isNone(maybeWhisperingTabId)) {
		return yield* new WhisperingError({
			title: 'Whispering tab not found',
			description: `Could not find a Whispering tab to call "toggleRecording" command`,
		});
	}
	const whisperingTabId = maybeWhisperingTabId.value;
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
	return true as const;
});

export type RequestBody = {};

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	toggleRecording.pipe(
		Effect.tapError(renderErrorAsToast),
		effectToResult,
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
