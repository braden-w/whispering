import { Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { WhisperingErr } from '@repo/shared';
import type { ClipboardService } from './ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	setClipboardText: async (text) => {
		const setClipboardResult = await tryAsync({
			try: () => navigator.clipboard.writeText(text),
			mapErr: (error) =>
				WhisperingErr({
					title: 'Unable to copy to clipboard',
					description:
						'There was an error copying to the clipboard using the browser Clipboard API. Please try again.',
					action: { type: 'more-details', error },
				}),
		});

		if (!setClipboardResult.ok) {
			const sendMessageToExtensionResult = await extension.setClipboardText({
				transcribedText: text,
			});
			if (!sendMessageToExtensionResult.ok) return sendMessageToExtensionResult;
			return Ok(undefined);
		}
		return Ok(undefined);
	},

	writeTextToCursor: async (text) => {
		const sendMessageToExtensionResult = await extension.writeTextToCursor({
			transcribedText: text,
		});
		if (!sendMessageToExtensionResult.ok) return sendMessageToExtensionResult;
		return Ok(undefined);
	},
});
