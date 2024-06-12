import type { Result } from '@repo/shared';
import { Console, Data, Effect, Option } from 'effect';
import { WhisperingError } from '~lib/errors';

class GetCurrentTabIdError extends Data.TaggedError('GetCurrentTabIdError') {}

const getCurrentTabId = Effect.gen(function* () {
	const [currentTab] = yield* Effect.promise(() =>
		chrome.tabs.query({ active: true, currentWindow: true }),
	);
	return yield* Option.fromNullable(currentTab?.id);
}).pipe(Effect.mapError(() => new GetCurrentTabIdError()));

const handler = (text: string) =>
	Effect.gen(function* () {
		const currentTabId = yield* getCurrentTabId;
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript<[string], Result<string, unknown>>({
					target: { tabId: currentTabId },
					world: 'MAIN',
					func: (text: string) => {
						try {
							navigator.clipboard.writeText(text);
							return { isSuccess: true, data: text } as const;
						} catch (error) {
							return { isSuccess: false, error } as const;
						}
					},
					args: [text],
				}),
			catch: (error) =>
				new WhisperingError({
					title: 'Unable to execute setClipboardText script in current tab',
					description: error instanceof Error ? error.message : `Unknown error: ${error}`,
					error,
				}),
		});
		if (!injectionResult) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in current tab',
				description: 'The result of the script injection is undefined',
			});
		}
		const { result } = injectionResult;
		yield* Console.info('setClipboardText result:', result);
		if (!result || !result.isSuccess) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in current tab',
				description:
					result?.error instanceof Error ? result.error.message : `Unknown error: ${result?.error}`,
				error: result?.error,
			});
		}
		return result.data;
	});

export default handler;
