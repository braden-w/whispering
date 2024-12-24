import { ClipboardService } from '$lib/services/ClipboardService';
import type { Recording } from '$lib/services/RecordingDbService';
import { toast } from '$lib/services/ToastService';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { Ok, createMutation } from '@epicenterhq/result';

const copyRecordingText = createMutation({
	mutationFn: async (recording: Recording) => {
		if (recording.transcribedText === '') return Ok(recording);
		const copyResult = await ClipboardService.setClipboardText(
			recording.transcribedText,
		);
		if (!copyResult.ok) return copyResult;
		return Ok(recording);
	},
	onSuccess: (_, { input: recording }) => {
		toast.success({
			title: 'Copied transcription to clipboard!',
			description: recording.transcribedText,
			descriptionClass: 'line-clamp-2',
		});
	},
	onError: (error) => {
		if (error._tag === 'ClipboardError') {
			renderErrAsToast({
				...error,
				title: 'Failed to copy transcription to clipboard',
				description: error.message,
				_tag: 'WhisperingError',
				action: { type: 'more-details', error: error.error },
			});
			return;
		}
		renderErrAsToast(error);
	},
});

export { copyRecordingText };
