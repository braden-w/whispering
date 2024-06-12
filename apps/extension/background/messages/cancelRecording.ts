import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Option, Effect } from 'effect';
import { getWhisperingTabId } from '~background/sendMessage';
import { WhisperingError } from '~lib/errors';

declare const window: {
	toggleRecording: () => void;
	cancelRecording: () => void;
} & Window;

export type RequestBody = {};

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const maybeWhisperingTabId = yield* getWhisperingTabId;
		if (Option.isNone(maybeWhisperingTabId)) {
			return yield* new WhisperingError({
				title: 'Whispering tab not found',
				description: `Could not find a Whispering tab to cancel recording`,
			});
		}
		const whisperingTabId = maybeWhisperingTabId.value;
		chrome.scripting.executeScript({
			target: { tabId: whisperingTabId },
			world: 'MAIN',
			func: () => window.cancelRecording(),
		});
		return true as const;
	}).pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
