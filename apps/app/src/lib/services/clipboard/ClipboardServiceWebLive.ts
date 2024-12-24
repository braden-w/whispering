import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { Ok, tryAsync } from '@epicenterhq/result';
import { ClipboardServiceErr, type ClipboardService } from './ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	setClipboardText: async (text) => {
		const setClipboardResult = await tryAsync({
			try: () => navigator.clipboard.writeText(text),
			mapErr: (error) =>
				ClipboardServiceErr({
					message:
						'There was an error writing to the clipboard using the browser Clipboard API. Please try again.',
					error,
				}),
		});

		if (!setClipboardResult.ok) {
			sendMessageToExtension({
				name: 'whispering-extension/setClipboardText',
				body: { transcribedText: text },
			});
			return setClipboardResult;
		}
		return Ok(undefined);
	},

	writeTextToCursor: async (text) => {
		const sendMessageToExtensionResult = await sendMessageToExtension({
			name: 'whispering-extension/writeTextToCursor',
			body: { transcribedText: text },
		});
		if (!sendMessageToExtensionResult.ok) {
			return ClipboardServiceErr({
				message:
					'There was an error writing text to the cursor using the Whispering extension. Please try again.',
				error: sendMessageToExtensionResult.error,
			});
		}
		return Ok(undefined);
	},
});
