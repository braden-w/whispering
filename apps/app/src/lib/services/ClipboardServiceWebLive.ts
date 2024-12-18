import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { Ok, type WhisperingResult, tryAsyncWhispering } from '@repo/shared';
import type { ClipboardService } from './ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	async setClipboardText(text): Promise<WhisperingResult<void>> {
		const setClipboardResult = await tryAsyncWhispering({
			try: () => navigator.clipboard.writeText(text),
			catch: (error) => ({
				_tag: 'WhisperingError',
				title: 'Unable to write to clipboard',
				description:
					'There was an error writing to the clipboard using the browser Clipboard API. Please try again.',
				action: {
					type: 'more-details',
					error,
				},
			}),
		});

		if (!setClipboardResult.ok) {
			sendMessageToExtension({
				name: 'whispering-extension/setClipboardText',
				body: { transcribedText: text },
			});
			return Ok(undefined);
		}

		return setClipboardResult;
	},

	async writeTextToCursor(text) {
		const result = await sendMessageToExtension({
			name: 'whispering-extension/writeTextToCursor',
			body: { transcribedText: text },
		});
		if (!result.ok) return result;
		return Ok(undefined);
	},
});
