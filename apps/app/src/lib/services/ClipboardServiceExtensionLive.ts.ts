import { WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import { ClipboardService } from './ClipboardService';

export const ClipboardServiceExtensionLive = Layer.succeed(
	ClipboardService,
	ClipboardService.of({
		setClipboardText: (text) =>
			Effect.tryPromise({
				try: () => navigator.clipboard.writeText(text),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to write to clipboard',
						description:
							error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}),
		writeTextToCursor: (text) =>
			Effect.try({
				try: () => writeTextToCursor(text),
				catch: (error) =>
					new WhisperingError({
						title: 'Unable to write text to cursor',
						description:
							error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}),
	}),
);

/**
 * Insert the provided text at the cursor position in the currently active input element or append it
 * to the non-input active element.
 *
 * @param text - The text to be inserted.
 */
export function writeTextToCursor(text: string): void {
	const activeElement = document.activeElement;
	if (!isHTMLElement(activeElement)) return;

	if (isInputOrTextareaElement(activeElement)) {
		insertTextInInputElement(activeElement, text);
	} else if (activeElement.isContentEditable) {
		appendTextToContentEditableElement(activeElement, text);
	}
}

function isHTMLElement(element: unknown): element is HTMLElement {
	return element instanceof HTMLElement;
}

function isInputOrTextareaElement(
	element: HTMLElement,
): element is HTMLInputElement | HTMLTextAreaElement {
	return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}

/**
 * Handle the insertion of text for input and textarea elements.
 *
 * @param inputElement - The input element.
 * @param text - The text to be inserted.
 */
function insertTextInInputElement(
	inputElement: HTMLInputElement | HTMLTextAreaElement,
	text: string,
): void {
	const startPos = inputElement.selectionStart ?? 0;
	const endPos = inputElement.selectionEnd ?? 0;

	inputElement.focus();
	inputElement.setSelectionRange(startPos, endPos);

	// Use document.execCommand to insert the text, so it gets added to the undo stack
	document.execCommand('insertText', false, text);

	inputElement.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Handle the appending of text for non-input and non-textarea elements.
 *
 * @param element - The non-input element.
 * @param text - The text to be appended.
 */
function appendTextToContentEditableElement(
	element: HTMLElement,
	text: string,
): void {
	element.innerHTML += text;
}
