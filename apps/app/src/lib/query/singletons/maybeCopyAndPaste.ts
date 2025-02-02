import { ClipboardService } from '$lib/services';
import { toast } from '$lib/services/toast';
import { WHISPERING_RECORDINGS_PATHNAME } from '@repo/shared';
import { copyTextToClipboardWithToast } from '../clipboard/mutations';

export async function maybeCopyAndPaste({
	text,
	toastId,
	shouldCopy,
	shouldPaste,
	statusToToastText,
}: {
	text: string;
	toastId: string;
	shouldCopy: boolean;
	shouldPaste: boolean;
	statusToToastText: (status: null | 'COPIED' | 'COPIED+PASTED') => string;
}) {
	const toastNull = () =>
		toast.success({
			id: toastId,
			title: statusToToastText(null),
			description: text,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'button',
				label: 'Copy to clipboard',
				onClick: () =>
					copyTextToClipboardWithToast({
						label: 'transcribed text',
						text: text,
					}),
			},
		});

	const toastCopied = () =>
		toast.success({
			id: toastId,
			title: '📝 Recording transcribed and copied to clipboard!',
			description: text,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: WHISPERING_RECORDINGS_PATHNAME,
			},
		});

	const toastCopiedAndPasted = () =>
		toast.success({
			id: toastId,
			title: statusToToastText('COPIED+PASTED'),
			description: text,
			descriptionClass: 'line-clamp-2',
			action: {
				type: 'link',
				label: 'Go to recordings',
				goto: WHISPERING_RECORDINGS_PATHNAME,
			},
		});
	if (!shouldCopy) return toastNull();

	const copyResult = await ClipboardService.setClipboardText(text);
	if (!copyResult.ok) {
		toast.warning({
			id: toastId,
			title: '⚠️ Clipboard Access Failed',
			description:
				'Could not copy text to clipboard. This may be due to browser restrictions or permissions. You can copy the text manually below.',
			action: { type: 'more-details', error: copyResult.error },
		});
		toastNull();
		return;
	}

	if (!shouldPaste) return toastCopied();

	const pasteResult = await ClipboardService.writeTextToCursor(text);
	if (!pasteResult.ok) {
		toast.warning({
			title: '⚠️ Paste Operation Failed',
			description:
				'Text was copied to clipboard but could not be pasted automatically. Please use Ctrl+V (Cmd+V on Mac) to paste manually.',
			action: { type: 'more-details', error: pasteResult.error },
		});
		toastCopied();
		return;
	}

	toastCopiedAndPasted();
}
