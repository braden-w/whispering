import type { Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { getCurrentTabId } from '~background/messages/getActiveTabId';
import { WhisperingError } from '~lib/errors';
import { extensionStorage } from '~lib/services/extension-storage';

const handler = (text: string) =>
	Effect.gen(function* () {
		const currentTabId = yield* getCurrentTabId;
		yield* extensionStorage.set({
			key: 'whispering-latest-recording-transcribed-text',
			value: text,
		});
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
	}).pipe(
		Effect.catchTags({
			GetCurrentTabIdError: () =>
				new WhisperingError({
					title: 'Unable to get current tab ID to copy transcribed text to clipboard',
					description:
						'Please go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
				}),
		}),
	);

export default handler;
