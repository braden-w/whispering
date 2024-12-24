import { sendMessageToExtension } from '$lib/sendMessageToExtension';
import { Ok } from '@repo/shared/epicenter-result';
import type { ClipboardService } from './clipboard/ClipboardService';
import {
	ClipboardServiceError,
	tryAsyncClipboardService,
} from './clipboard/ClipboardService';

export const createClipboardServiceWebLive = (): ClipboardService => ({
	async setClipboardText(text) {
		const setClipboardResult = await tryAsyncClipboardService({
			try: () => navigator.clipboard.writeText(text),
			mapErr: (error) => ({
				_tag: 'ClipboardError',
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

	async writeTextToCursor(text) {
		const sendMessageToExtensionResult = await sendMessageToExtension({
			name: 'whispering-extension/writeTextToCursor',
			body: { transcribedText: text },
		});
		if (!sendMessageToExtensionResult.ok) {
			return ClipboardServiceError({
				_tag: 'ClipboardError',
				message:
					'There was an error writing text to the cursor using the Whispering extension. Please try again.',
				error: sendMessageToExtensionResult.error,
			});
		}
		return Ok(undefined);
	},
});
