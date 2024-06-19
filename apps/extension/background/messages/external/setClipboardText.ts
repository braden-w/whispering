import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Console, Effect } from 'effect';
import { getActiveTabId } from '~background/messages/getActiveTabId';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';
import { extensionStorageService } from '~lib/services/extension-storage';

const setClipboardText = (text: string): Effect.Effect<void, WhisperingError> =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		yield* extensionStorageService['whispering-latest-recording-transcribed-text'].set(text);
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
		}),
	);

export type RequestBody = { transcribedText: string };

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.transcribedText) {
			return yield* new WhisperingError({
				title: 'Error invoking setClipboardText command',
				description: 'Text must be provided in the request body of the message',
			});
		}
		yield* setClipboardText(body.transcribedText);
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
