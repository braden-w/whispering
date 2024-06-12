import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Effect } from 'effect';
import { getWhisperingTabId } from '~background/sendMessage';

declare const window: {
	toggleRecording: () => void;
	cancelRecording: () => void;
} & Window;

export const toggleRecording = Effect.gen(function* () {
	const tabId = yield* getWhisperingTabId;
	chrome.scripting.executeScript({
		target: { tabId },
		world: 'MAIN',
		func: () => window.toggleRecording(),
	});
	return true as const;
});

export type RequestBody = {};

export type ResponseBody = Result<true>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	toggleRecording.pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
