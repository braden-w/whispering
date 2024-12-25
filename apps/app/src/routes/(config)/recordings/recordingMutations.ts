import { toast } from '$lib/services/ToastService';
import { recordings } from '$lib/services/db';
import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
import { createMutation } from '@epicenterhq/result';

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
