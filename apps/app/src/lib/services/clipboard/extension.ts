import { tryAsync } from 'wellcrafted/result';
import { type ClipboardService, ClipboardServiceErr } from './types';

export function createClipboardServiceExtension(): ClipboardService {
	return {
		copyToClipboard: (text) =>
			tryAsync({
				try: () => navigator.clipboard.writeText(text),
				mapErr: (error) =>
					ClipboardServiceErr({
						message: 'Unable to copy to clipboard',
						context: { text },
						cause: error,
					}),
			}),

		pasteFromClipboard: () =>
			tryAsync({
				try: async () => {
					const text = await navigator.clipboard.readText();
					return writeTextToCursor(text);
				},
				mapErr: (error) =>
					ClipboardServiceErr({
						message: 'Unable to paste from clipboard at cursor position',
						cause: error,
					}),
			}),
	};
}

/**
 * Insert the provided text at the cursor position in the currently active input element or append it
 * to the non-input active element.
 *
 * @param text - The text to be inserted.
 */
function writeTextToCursor(text: string): void {
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
