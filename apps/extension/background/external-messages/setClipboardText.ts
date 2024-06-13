import type { Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { getActiveTabId } from '~background/messages/getActiveTabId';
import { WhisperingError } from '~lib/errors';
import { extensionStorage } from '~lib/services/extension-storage';

const handler = (text: string) =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		yield* extensionStorage.set({
			key: 'whispering-latest-recording-transcribed-text',
			value: text,
		});
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript<[string], Result<string, unknown>>({
					target: { tabId: activeTabId },
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
					title: 'Unable to execute setClipboardText script in active tab',
					description: error instanceof Error ? error.message : `Unknown error: ${error}`,
					error,
				}),
		});
		if (!injectionResult) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in active tab',
				description: 'The result of the script injection is undefined',
			});
		}
		const { result } = injectionResult;
		yield* Console.info('setClipboardText result:', result);
		if (!result || !result.isSuccess) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in active tab',
				description:
					result?.error instanceof Error ? result.error.message : `Unknown error: ${result?.error}`,
				error: result?.error,
			});
		}
		return result.data;
	}).pipe(
		Effect.catchTags({
			GetActiveTabIdError: () =>
				new WhisperingError({
					title: 'Unable to get active tab ID to copy transcribed text to clipboard',
					description:
						'Please go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
				}),
			SetExtensionStorageError: (error) =>
				new WhisperingError({
					title: 'Unable to set transcribed text in popup via extension storage',
					description:
						error instanceof Error
							? error.message
							: `Unknown error writing to extension storage: ${error}`,
					error,
				}),
		}),
	);

export default handler;
