/**
 * Writes the specified text to the user's clipboard without removing focus from the current input element.
 * @param text - The text to write to the clipboard.
 */
export function writeTextToClipboard(text: string) {
	const previousFocus = document.activeElement as HTMLElement;

	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';

	document.body.appendChild(textarea);

	textarea.select();

	try {
		const successful = document.execCommand('copy');
		if (!successful) {
			throw new Error('Failed to write text to the clipboard.');
		}
	} catch (error) {
		console.error('Failed to write text to the clipboard:', error);
	} finally {
		document.body.removeChild(textarea);

		if (previousFocus && typeof previousFocus.focus === 'function') {
			previousFocus.focus();
		}
	}
}

/**
 * Insert the provided text at the cursor position in the currently active input element or append it
 * to the non-input active element.
 *
 * @param text - The text to be inserted.
 */
export function writeToCursor(text: string): void {
	const activeElement = document.activeElement;

	if (!activeElement) return;

	if (isInputElement(activeElement)) {
		handleInputElement(activeElement, text);
	} else {
		handleNonInputElement(activeElement, text);
	}
}

/**
 * Check if the given element is an input or textarea element.
 *
 * @param element - The HTML element to check.
 * @returns True if the element is an input or textarea element, false otherwise.
 */
function isInputElement(element: Element): element is HTMLInputElement | HTMLTextAreaElement {
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
	const inputValue = inputElement.value;

	inputElement.value = `${inputValue.slice(0, startPos)}${text}${inputValue.slice(endPos)}`;

	inputElement.setSelectionRange(startPos + text.length, startPos + text.length);
}

/**
 * Handle the appending of text for non-input and non-textarea elements.
 *
 * @param element - The non-input element.
 * @param text - The text to be appended.
 */
function handleNonInputElement(element: Element, text: string): void {
	element.innerHTML += text;
}
