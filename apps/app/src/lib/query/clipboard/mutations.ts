import { ClipboardService, createResultMutation } from '$lib/services';
import { toast } from '$lib/services/toast';

export type CopyToClipboardLabel =
	| 'transcribed text'
	| 'transcribed text (joined)'
	| 'transformed text'
	| 'code'
	| 'latest transformation run output';

export function useCopyTextToClipboardWithToast() {
	return {
		copyTextToClipboardWithToast: createResultMutation(() => ({
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
		})),
	};
}
