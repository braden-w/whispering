import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Console, Option, Effect } from 'effect';
import { getOrCreateWhisperingTabId } from '~background/sendMessage';
import { WhisperingError, renderErrorAsToast } from '~lib/errors';

declare const window: {
	toggleRecording: () => void;
	cancelRecording: () => void;
} & Window;

export const toggleRecording = Effect.gen(function* () {
	const maybeWhisperingTabId = yield* getOrCreateWhisperingTabId;
	yield* Console.info('Whispering tab ID:', maybeWhisperingTabId);
	if (Option.isNone(maybeWhisperingTabId)) {
		return yield* new WhisperingError({
			title: 'Whispering tab not found',
			description: `Could not find a Whispering tab to call "toggleRecording" command`,
		});
	}
	const whisperingTabId = maybeWhisperingTabId.value;
	yield* Console.info('Whispering tab ID:', whisperingTabId);
	yield* Effect.tryPromise({
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
	return true as const;
});

export type RequestBody = {};

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	toggleRecording.pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
