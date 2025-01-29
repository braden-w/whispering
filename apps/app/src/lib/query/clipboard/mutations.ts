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

export function useCopyTextToClipboardWithToast() {
	return createResultMutation(() => ({
		mutationFn: async ({
			text,
		}: { label: CopyToClipboardLabel; text: string }) => {
			const copyResult = await ClipboardService.setClipboardText(text);
			return copyResult;
		},
		onSuccess: (_data, { label, text }) => {
			toast.success({
				title: `Copied ${label} to clipboard!`,
				description: text,
				descriptionClass: 'line-clamp-2',
			});
		},
		onError: (error, { label }) => {
			toast.error({
				title: `Error copying ${label} to clipboard`,
				description: error.description,
			});
		},
	}));
}

export async function writeTextToCursor(text: string) {
	const result = await ClipboardService.writeTextToCursor(text);
	return result;
}
