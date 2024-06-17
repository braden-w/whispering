import type { Result } from '@repo/shared';
import { WhisperingError } from '@repo/shared';
import { Console, Effect } from 'effect';
import { getActiveTabId } from '~background/messages/getActiveTabId';
import { extensionStorageService } from '~lib/services/extension-storage';

export const setClipboardText = (text: string): Effect.Effect<void, WhisperingError> =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		yield* extensionStorageService.set({
			key: 'whispering-latest-recording-transcribed-text',
			value: text,
		});
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript<[string], Result<string>>({
					target: { tabId: activeTabId },
					world: 'MAIN',
					func: (text: string) => {
						try {
							navigator.clipboard.writeText(text);
							return { isSuccess: true, data: text } as const;
						} catch (error) {
							return {
								isSuccess: false,
								error: {
									title: 'Unable to copy transcribed text to clipboard in active tab',
									description: error instanceof Error ? error.message : `Unknown error: ${error}`,
									error,
								},
							} as const;
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
		yield* Console.info('Injection result "setClipboardText" script:', injectionResult);
		if (!injectionResult || !injectionResult.result) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in active tab',
				description: 'The result of the script injection is undefined',
			});
		}
		const { result } = injectionResult;
		yield* Console.info('setClipboardText result:', result);
		if (!result.isSuccess) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in active tab',
				description:
					result.error instanceof Error ? result.error.message : `Unknown error: ${result.error}`,
				error: result.error,
			});
		}
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
