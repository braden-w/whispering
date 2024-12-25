import { Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { ClipboardServiceErr, type ClipboardService } from './ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	setClipboardText: async (text) => {
		const setClipboardResult = await tryAsync({
			try: () => navigator.clipboard.writeText(text),
			mapErr: (error) =>
				ClipboardServiceErr({
					message:
						'There was an error copying to the clipboard using the browser Clipboard API. Please try again.',
					error,
				}),
		});

		if (!setClipboardResult.ok) {
			const sendMessageToExtensionResult = await extension.setClipboardText({
				transcribedText: text,
			});
			if (!sendMessageToExtensionResult.ok)
				return ClipboardServiceErr({
					message:
						'There was an error sending a message to the Whispering extension to copy text to the clipboard. Please try again.',
					error: sendMessageToExtensionResult.error,
				});
			const setClipboardResult = sendMessageToExtensionResult.data;
			if (!setClipboardResult.ok) {
				return ClipboardServiceErr({
					message:
						'There was an error copying text to the clipboard using the Whispering extension. Please try again.',
					error: setClipboardResult.error,
				});
			}
			return Ok(undefined);
		}
		return Ok(undefined);
	},

	writeTextToCursor: async (text) => {
		const sendMessageToExtensionResult = await extension.writeTextToCursor({
			transcribedText: text,
		});
		if (!sendMessageToExtensionResult.ok) {
			return ClipboardServiceErr({
				message:
					'There was an error sending a message to the Whispering extension to write text to the cursor. Please try again.',
				error: sendMessageToExtensionResult.error,
			});
		}
		const writeTextToCursorResult = sendMessageToExtensionResult.data;
		if (!writeTextToCursorResult.ok) {
			return ClipboardServiceErr({
				message:
					'There was an error writing text to the cursor using the Whispering extension. Please try again.',
				error: writeTextToCursorResult.error,
			});
		}
		return Ok(undefined);
	},
});
