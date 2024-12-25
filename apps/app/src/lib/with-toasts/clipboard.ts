import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import { createMutation } from '@epicenterhq/result';
import { toast } from '$lib/services/ToastService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';

export const copyToClipboardWithToast = createMutation({
	mutationFn: ClipboardService.setClipboardText,
	onSuccess: (_, { input: text }) => {
		toast.success({
			title: 'Copied transcription to clipboard!',
			description: text,
			descriptionClass: 'line-clamp-2',
		});
	},
	onError: (error) => {
		if (error._tag === 'ClipboardError') {
			renderErrAsToast({
				variant: 'error',
				title: 'Error copying transcription to clipboard',
				description: 'Please try again.',
				action: { type: 'more-details', error: error },
			});
			return;
		}
		renderErrAsToast(error);
	},
});
