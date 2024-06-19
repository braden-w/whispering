import type { PlasmoMessaging } from '@plasmohq/messaging';
import type { Result } from '@repo/shared';
import { WhisperingError, effectToResult } from '@repo/shared';
import { Console, Effect } from 'effect';
import { getActiveTabId } from '~background/messages/getActiveTabId';
import { renderErrorAsToast } from '~lib/errors';
import { ToastServiceBgswLive } from '~lib/services/ToastServiceBgswLive';

const writeTextToCursor = (text: string): Effect.Effect<void, WhisperingError> =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript<[string], Result<string>>({
					target: { tabId: activeTabId },
					world: 'MAIN',
					func: (text: string) => {
						const activeElement = document.activeElement;
						if (!activeElement)
							return {
								isSuccess: false,
								error: {
									title: 'Unable to write transcribed text to active tab',
									description: 'No active element found in the document',
								},
							};

						if (activeElement.isContentEditable) {
							try {
								document.execCommand('insertText', false, text);
							} catch (e) {
								// Fallback for older browsers
								let range = document.getSelection().getRangeAt(0);
								range.deleteContents();
								range.insertNode(document.createTextNode(text));
							}
						} else if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
							let start = activeElement.selectionStart;
							let end = activeElement.selectionEnd;

							// Insert text at the cursor position
							let value = activeElement.value;
							activeElement.value = value.slice(0, start) + text + value.slice(end);

							// Update the cursor position
							activeElement.selectionStart = start + text.length;
							activeElement.selectionEnd = start + text.length;

							// Trigger the input event for undo/redo functionality
							let event = new Event('input', { bubbles: true });
							activeElement.dispatchEvent(event);
						} else {
							console.warn('The active element is not editable.');
						}

						return { isSuccess: true, data: text } as const;
					},
					args: [text],
				}),
			catch: (error) =>
				new WhisperingError({
					title: 'Unable to execute writeTextToCursor script in active tab',
					description: error instanceof Error ? error.message : `Unknown error: ${error}`,
					error,
				}),
		});
		yield* Console.info('Injection result "writeTextToCursor" script:', injectionResult);
		if (!injectionResult || !injectionResult.result) {
			return yield* new WhisperingError({
				title: 'Unable to write transcribed text to active tab',
				description: 'The result of the script injection is undefined',
			});
		}
		const { result } = injectionResult;
		yield* Console.info('writeTextToCursor result:', result);
		if (!result.isSuccess) {
			return yield* new WhisperingError({
				title: 'Unable to write transcribed text to active tab',
				description:
					result.error instanceof Error ? result.error.message : `Unknown error: ${result.error}`,
				error: result.error,
			});
		}
	}).pipe(
		Effect.catchTags({
			GetActiveTabIdError: () =>
				new WhisperingError({
					title: 'Unable to get active tab ID to write transcribed text to cursor',
					description:
						'Please try pasting or go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
				}),
		}),
	);

export type RequestBody = { transcribedText: string };

export type ResponseBody = Result<void>;

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = ({ body }, res) =>
	Effect.gen(function* () {
		if (!body?.transcribedText) {
			return yield* new WhisperingError({
				title: 'Error invoking writeTextToCursor command',
				description: 'Text must be provided in the request body of the message',
			});
		}
		yield* writeTextToCursor(body.transcribedText);
	}).pipe(
		Effect.tapError(renderErrorAsToast),
		Effect.provide(ToastServiceBgswLive),
		effectToResult,
		Effect.map(res.send),
		Effect.runPromise,
	);

export default handler;
