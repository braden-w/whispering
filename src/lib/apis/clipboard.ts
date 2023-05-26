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
 * Pastes the contents of the clipboard to the current input element.
 */
export function writeToCursor(text: string) {
	const inputElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;

	if (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA') {
		const startPos = inputElement.selectionStart;
		const endPos = inputElement.selectionEnd;
		const inputValue = inputElement.value;

		inputElement.value =
			inputValue.substring(0, startPos) + text + inputValue.substring(endPos, inputValue.length);

		// Set the cursor position after the inserted text
		inputElement.setSelectionRange(startPos + text.length, startPos + text.length);
	} else {
		// For non-input elements, simply append the text
		inputElement.innerHTML += text;
	}
}
