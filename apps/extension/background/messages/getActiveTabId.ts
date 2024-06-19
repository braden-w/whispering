import type { PlasmoMessaging } from '@plasmohq/messaging';
import { WhisperingError, effectToResult, type Result } from '@repo/shared';
import { Data, Effect, Option } from 'effect';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

class GetActiveTabIdError extends Data.TaggedError('GetActiveTabIdError') {}

export const getActiveTabId = Effect.gen(function* () {
	const [activeTab] = yield* Effect.promise(() =>
		chrome.tabs.query({ active: true, currentWindow: true }),
	);
	return yield* Option.fromNullable(activeTab?.id);
}).pipe(Effect.mapError(() => new GetActiveTabIdError()));

export type RequestBody = {};

export type ResponseBody = Result<number>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = (req, res) =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		return activeTabId;
	}).pipe(
		Effect.catchTags({
			GetActiveTabIdError: (error) =>
				new WhisperingError({
					title: 'Failed to get active tab ID',
					description: 'Failed to get active tab ID',
					error,
				}),
		}),
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
