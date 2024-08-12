import { Data, Effect, Option } from 'effect';

class GetActiveTabIdError extends Data.TaggedError('GetActiveTabIdError') {}

export const getActiveTabId = Effect.gen(function* () {
	const [activeTab] = yield* Effect.promise(() =>
		chrome.tabs.query({ active: true, currentWindow: true }),
	);
	return yield* Option.fromNullable(activeTab?.id);
}).pipe(Effect.mapError(() => new GetActiveTabIdError()));
