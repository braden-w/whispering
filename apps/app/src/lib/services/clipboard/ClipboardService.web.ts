import { Ok, tryAsync } from '@epicenterhq/result';
import { extension } from '@repo/extension';
import { WhisperingErr } from '@repo/shared';
import type { ClipboardService } from './ClipboardService';

export function createClipboardServiceWeb(): ClipboardService {
	return {
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
				const setClipboardTextResult = await extension.setClipboardText({
					transcribedText: text,
				});
				if (!setClipboardTextResult.ok) return setClipboardTextResult;
				return Ok(undefined);
			}
			return Ok(undefined);
		},

		writeTextToCursor: async (text) => {
			const writeTextToCursorResult = await extension.writeTextToCursor({
				transcribedText: text,
			});
			if (!writeTextToCursorResult.ok) return writeTextToCursorResult;
			return Ok(undefined);
		},
	};
}
