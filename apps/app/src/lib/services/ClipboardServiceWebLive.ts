import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { Ok, type WhisperingResult, tryAsyncWhispering } from '@repo/shared';
import type { ClipboardService } from './ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	async setClipboardText(text, { onMutate, onSuccess, onError, onSettled }) {
		onMutate(text);

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

		if (setClipboardResult.ok) {
			onSuccess();
		} else {
			sendMessageToExtension({
				name: 'whispering-extension/setClipboardText',
				body: { transcribedText: text },
			});
			onError(setClipboardResult.error);
		}
		onSettled();
	},

	async writeTextToCursor(text, { onMutate, onSuccess, onError, onSettled }) {
		onMutate(text);
		const result = await sendMessageToExtension({
			name: 'whispering-extension/writeTextToCursor',
			body: { transcribedText: text },
		});
		if (result.ok) {
			onSuccess();
		} else {
			onError(result.error);
		}
		onSettled();
	},
});
