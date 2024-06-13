import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Data, Effect, Option } from 'effect';

class GetCurrentTabIdError extends Data.TaggedError('GetCurrentTabIdError') {}

export const getCurrentTabId = Effect.gen(function* () {
	const [currentTab] = yield* Effect.promise(() =>
		chrome.tabs.query({ active: true, currentWindow: true }),
	);
	return yield* Option.fromNullable(currentTab?.id);
}).pipe(Effect.mapError(() => new GetCurrentTabIdError()));

export type RequestBody = {};

export type ResponseBody = Result<number, GetCurrentTabIdError>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const currentTabId = yield* getCurrentTabId;
		return currentTabId;
	}).pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
