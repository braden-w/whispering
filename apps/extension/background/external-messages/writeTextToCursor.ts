import type { Result } from '@repo/shared';
import { Console, Effect } from 'effect';
import { getActiveTabId } from '~background/messages/getActiveTabId';
import { WhisperingError } from '@repo/shared';

const isTextarea = (element: Element): element is HTMLTextAreaElement =>
	element.tagName === 'TEXTAREA';

const isInput = (element: Element): element is HTMLInputElement => element.tagName === 'INPUT';

const handler = (text: string) =>
	Effect.gen(function* () {
		const activeTabId = yield* getActiveTabId;
		const [injectionResult] = yield* Effect.tryPromise({
			try: () =>
				chrome.scripting.executeScript<[string], Result<string, unknown>>({
					target: { tabId: activeTabId },
					world: 'MAIN',
					func: (text: string) => {
						const activeElement = document.activeElement;
						if (!activeElement)
							return { isSuccess: false, error: new Error('No active element found') };

						if (isTextarea(activeElement) || isInput(activeElement)) {
							const startPos = activeElement.selectionStart;
							const endPos = activeElement.selectionEnd;
							const value = activeElement.value;

							// Using execCommand to insert text and ensure it is registered in undo/redo stack
							if (document.queryCommandSupported('insertText')) {
								activeElement.focus();
								document.execCommand('insertText', false, text);
							} else {
								activeElement.value = value.substring(0, startPos) + text + value.substring(endPos);
								activeElement.selectionStart = activeElement.selectionEnd = startPos + text.length;
							}
						} else if (activeElement.isContentEditable) {
							const selection = window.getSelection();
							if (selection.rangeCount > 0) {
								const range = selection.getRangeAt(0);
								range.deleteContents();

								// Create a new text node and insert it
								const textNode = document.createTextNode(text);
								range.insertNode(textNode);

								// Move the cursor to the end of the inserted text node
								range.setStartAfter(textNode);
								range.setEndAfter(textNode);
								selection.removeAllRanges();
								selection.addRange(range);

								// Using execCommand to make the insertion undoable
								document.execCommand('insertText', false, textNode.nodeValue);
							}
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
		if (!injectionResult) {
			return yield* new WhisperingError({
				title: 'Unable to copy transcribed text to clipboard in active tab',
				description: 'The result of the script injection is undefined',
			});
		}
		const { result } = injectionResult;
		yield* Console.info('writeTextToCursor result:', result);
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
					title: 'Unable to get active tab ID to write transcribed text to cursor',
					description:
						'Please try pasting or go to your recordings tab in the Whispering website to copy the transcribed text to clipboard',
				}),
		}),
	);

export default handler;
