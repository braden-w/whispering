import type { Recording } from '$lib/services/db';
import {
	createResultMutation,
	userConfiguredServices,
} from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr } from '@repo/shared';

export const updateRecordingWithToast = createResultMutation(() => ({
	mutationFn: async (recording: Recording) => {
		const result = await userConfiguredServices.db.updateRecording(recording);
		if (!result.ok) {
			return WhisperingErr({
				title: 'Failed to update recording!',
				description: 'Your recording could not be updated.',
				action: { type: 'more-details', error: result.error },
			});
		}
		return Ok(recording);
	},
	onSuccess: () => {
		toast.success({
			title: 'Updated recording!',
			description: 'Your recording has been updated successfully.',
		});
	},
	onError: (error) => {
		toast.error({
			title: 'Failed to update recording!',
			description: 'Your recording could not be updated.',
			action: { type: 'more-details', error },
		});
	},
}));

export const deleteRecordingWithToast = createResultMutation(() => ({
	mutationFn: async (recording: Recording) => {
		const result = await userConfiguredServices.db.deleteRecording(recording);
		if (!result.ok) {
			return WhisperingErr({
				title: 'Failed to delete recording!',
				description: 'Your recording could not be deleted.',
				action: { type: 'more-details', error: result.error },
			});
		}
		return Ok(recording);
	},
	onSuccess: () => {
		toast.success({
			title: 'Deleted recording!',
			description: 'Your recording has been deleted successfully.',
		});
	},
	onError: (error) => {
		toast.error(error);
	},
}));

export const deleteRecordingsWithToast = createResultMutation(() => ({
	mutationFn: async (recordings: Recording[]) => {
		const result = await userConfiguredServices.db.deleteRecordings(recordings);
		if (!result.ok) {
			return WhisperingErr({
				title: 'Failed to delete recordings!',
				description: 'Your recordings could not be deleted.',
				action: { type: 'more-details', error: result.error },
			});
		}
		return Ok(recordings);
	},
	onSuccess: () => {
		toast.success({
			title: 'Deleted recordings!',
			description: 'Your recordings have been deleted successfully.',
		});
	},
	onError: (error) => {
		toast.error(error);
	},
}));
