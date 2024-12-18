import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { type Result, tryAsync } from '@repo/shared';
import type { ClipboardService } from './ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	setClipboardText: async (text): Promise<Result<void>> => {
		const setClipboardResult = await tryAsync({
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
			return sendMessageToExtension({
				name: 'whispering-extension/setClipboardText',
				body: { transcribedText: text },
			});
		}

		return setClipboardResult;
	},

	writeTextToCursor: (text) =>
		sendMessageToExtension({
			name: 'whispering-extension/writeTextToCursor',
			body: { transcribedText: text },
		}),
});
