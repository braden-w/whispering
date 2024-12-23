import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { Ok, tryAsyncWhispering } from '@repo/shared';
import type { ClipboardService } from './ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	async setClipboardText(text) {
		const setClipboardResult = await tryAsyncWhispering({
			try: () => navigator.clipboard.writeText(text),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: 'Unable to write to clipboard',
				description:
					'There was an error writing to the clipboard using the browser Clipboard API. Please try again.',
				action: { type: 'more-details', error },
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

	async writeTextToCursor(text) {
		const writeTextToCursorResult = await tryAsyncWhispering({
			try: () => navigator.clipboard.writeText(text),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: 'Unable to write to clipboard',
				description:
					'There was an error writing to the clipboard using the browser Clipboard API. Please try again.',
				action: { type: 'more-details', error },
			}),
		});

		if (!writeTextToCursorResult.ok) {
			sendMessageToExtension({
				name: 'whispering-extension/writeTextToCursor',
				body: { transcribedText: text },
			});
			return writeTextToCursorResult;
		}
		return Ok(undefined);
	},
});
