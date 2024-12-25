import { toast } from '$lib/services/ToastService';
import { ClipboardService } from '$lib/services/clipboard/ClipboardService';
import type { Recording } from '$lib/services/db';
import { recordings } from '$lib/services/db';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { Ok, createMutation } from '@epicenterhq/result';

export const updateRecordingWithToast = createMutation({
	mutationFn: recordings.updateRecording,
	onSuccess: () => {
		toast.success({
			title: 'Updated recording!',
			description: 'Your recording has been updated successfully.',
		});
	},
	onError: (error) => renderErrAsToast(error),
});

export const deleteRecordingsByIdWithToast = createMutation({
	mutationFn: recordings.deleteRecordingsById,
	onSuccess: (_, { input: ids }) => {
		toast.success({
			title: 'Deleted recordings!',
			description: 'Your recordings have been deleted successfully.',
		});
	},
	onError: (error) => renderErrAsToast(error),
});

export const deleteRecordingByIdWithToast = createMutation({
	mutationFn: recordings.deleteRecordingById,
	onSuccess: (_, { input: id }) => {
		toast.success({
			title: 'Deleted recording!',
			description: 'Your recording has been deleted successfully.',
		});
	},
	onError: (error) => renderErrAsToast(error),
});

export const copyRecordingText = createMutation({
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
				action: { type: 'more-details', error: error.error },
			});
			return;
		}
		renderErrAsToast(error);
	},
});
