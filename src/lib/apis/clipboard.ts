/**
 * Writes the specified text to the user's clipboard without removing focus from the current input element.
 *
 * @param text - The text to write to the clipboard.
 */
export function writeTextToClipboard(text: string): void {
	const previousFocus = document.activeElement as HTMLElement | null;

	const textarea: HTMLTextAreaElement = createInvisibleTextArea(text);
	document.body.appendChild(textarea);

	try {
		copyToClipboard(textarea);
	} catch (error) {
		console.error('Failed to write text to the clipboard:', error);
	} finally {
		document.body.removeChild(textarea);
		restorePreviousFocus(previousFocus);
	}
}

/**
 * Creates an invisible textarea with given text.
 *
 * @param {string} text - The text to be filled into the textarea.
 * @returns {HTMLTextAreaElement} A textarea element.
 */
function createInvisibleTextArea(text: string): HTMLTextAreaElement {
	const textarea: HTMLTextAreaElement = document.createElement('textarea');
	textarea.value = text;
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';

	return textarea;
}

/**
 * Executes the copy command on the given textarea.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea containing the text to be copied.
 * @throws {Error} If failed to execute the copy command.
 */
function copyToClipboard(textarea: HTMLTextAreaElement): void {
	textarea.select();

	const successful = document.execCommand('copy');
	if (!successful) {
		throw new Error('Failed to write text to the clipboard.');
	}
}

/**
 * Restores focus to the previously focused element, if it exists.
 *
 * @param {HTMLElement | null} element - The previously focused element.
 */
function restorePreviousFocus(element: HTMLElement | null): void {
	if (element && typeof element.focus === 'function') {
		element.focus();
	}
}

/**
 * Insert the provided text at the cursor position in the currently active input element or append it
 * to the non-input active element.
 *
 * @param text - The text to be inserted.
 */
export function writeTextToCursor(text: string): void {
	const activeElement = document.activeElement;
	if (!isHTMLElement(activeElement)) return;

	if (isInputElement(activeElement)) {
		handleInputElement(activeElement, text);
	} else {
		handleNonInputElement(activeElement, text);
	}
}

function isHTMLElement(element: unknown): element is HTMLElement {
	return element instanceof HTMLElement;
}

/**
 * Check if the given element is an input or textarea element.
 *
 * @param element - The HTML element to check.
 * @returns True if the element is an input or textarea element, false otherwise.
 */
function isInputElement(element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement {
	return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}

/**
 * Handle the insertion of text for input and textarea elements.
 *
 * @param inputElement - The input element.
 * @param text - The text to be inserted.
 */
function handleInputElement(
	inputElement: HTMLInputElement | HTMLTextAreaElement,
	text: string
): void {
	const startPos = inputElement.selectionStart ?? 0;
	const endPos = inputElement.selectionEnd ?? 0;

	inputElement.focus();
	inputElement.setSelectionRange(startPos, endPos);

	// Use document.execCommand to insert the text, so it gets added to the undo stack
	document.execCommand('insertText', false, text);

	const event = new Event('input', { bubbles: true });
	inputElement.dispatchEvent(event);
}

/**
 * Handle the appending of text for non-input and non-textarea elements.
 *
 * @param element - The non-input element.
 * @param text - The text to be appended.
 */
function handleNonInputElement(element: HTMLElement, text: string): void {
	if (!element.isContentEditable) return;
	element.innerHTML += text;
}
