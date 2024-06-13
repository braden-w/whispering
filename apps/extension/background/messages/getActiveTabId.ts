import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { Data, Effect, Option } from 'effect';

class GetActiveTabIdError extends Data.TaggedError('GetActiveTabIdError') {}

export const getActiveTabId = Effect.gen(function* () {
	const [activeTab] = yield* Effect.promise(() =>
		chrome.tabs.query({ active: true, currentWindow: true }),
	);
	return yield* Option.fromNullable(activeTab?.id);
}).pipe(Effect.mapError(() => new GetActiveTabIdError()));

export type RequestBody = {};

export type ResponseBody = Result<number, GetActiveTabIdError>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		return activeTabId;
	}).pipe(
		Effect.map((data) => ({ isSuccess: true, data }) as const),
		Effect.catchAll((error) => Effect.succeed({ isSuccess: false, error } as const)),
		Effect.map((payload) => res.send(payload)),
		Effect.runPromise,
	);

export default handler;
