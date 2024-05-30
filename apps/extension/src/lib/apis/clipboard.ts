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
