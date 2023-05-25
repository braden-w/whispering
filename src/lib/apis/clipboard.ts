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
