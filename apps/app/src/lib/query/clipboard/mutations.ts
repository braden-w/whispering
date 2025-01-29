import { ClipboardService, createResultMutation } from '$lib/services';
import { toast } from '$lib/services/toast';

export async function copyTextToClipboard(text: string) {
	const result = await ClipboardService.setClipboardText(text);
	return result;
}

export type CopyToClipboardLabel =
	| 'transcribed text'
	| 'transcribed text (joined)'
	| 'code'
	| 'latest transformation run output';

export async function copyTextToClipboardWithToast({
	label,
	text,
}: {
	label: CopyToClipboardLabel;
	text: string;
}) {
	const result = await ClipboardService.setClipboardText(text);
	if (!result.ok) {
		toast.error({
			title: `Error copying ${label} to clipboard`,
			description: result.error.description,
			action: { type: 'more-details', error: result.error },
		});
		return result;
	}
	toast.success({
		title: `Copied ${label} to clipboard!`,
		description: text,
		descriptionClass: 'line-clamp-2',
	});
	return result;
}

export async function writeTextToCursor(text: string) {
	const result = await ClipboardService.writeTextToCursor(text);
	return result;
}
