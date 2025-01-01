import { DbService, DownloadService } from '$lib/services.svelte';
import type { Recording } from '$lib/services/db';
import { toast } from '$lib/utils/toast';
import { createMutation } from '@tanstack/svelte-query';

export const createUpdateRecordingWithToast = () =>
	createMutation(() => ({
		mutationFn: async (recording: Recording) => {
			const result = await DbService.updateRecording(recording);
			if (!result.ok) {
				toast.error({
					title: 'Failed to update recording!',
					description: 'Your recording could not be updated.',
				});
				return;
			}
			toast.success({
				title: 'Updated recording!',
				description: 'Your recording has been updated successfully.',
			});
		},
	}));

export const createDeleteRecordingWithToast = () =>
	createMutation(() => ({
		mutationFn: async (recording: Recording) => {
			const result = await DbService.deleteRecording(recording);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete recording!',
					description: 'Your recording could not be deleted.',
				});
				return;
			}
			toast.success({
				title: 'Deleted recording!',
				description: 'Your recording has been deleted successfully.',
			});
		},
	}));

export const createDeleteRecordingsWithToast = () =>
	createMutation(() => ({
		mutationFn: async (recordings: Recording[]) => {
			const result = await DbService.deleteRecordings(recordings);
			if (!result.ok) {
				toast.error({
					title: 'Failed to delete recordings!',
					description: 'Your recordings could not be deleted.',
				});
				return;
			}
			toast.success({
				title: 'Deleted recordings!',
				description: 'Your recordings have been deleted successfully.',
			});
		},
	}));

export const createDownloadRecordingWithToast = () =>
	createMutation(() => ({
		mutationFn: async (recording: Recording) => {
			if (!recording.blob) {
				toast.error({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to download.",
				});
				return;
			}
			const result = await DownloadService.downloadBlob({
				name: `whispering_recording_${recording.id}`,
				blob: recording.blob,
			});
			if (!result.ok) {
				toast.error({
					title: 'Failed to download recording!',
					description: 'Your recording could not be downloaded.',
					action: { type: 'more-details', error: result.error },
				});
				return;
			}
			toast.success({
				title: 'Recording downloading!',
				description: 'Your recording is being downloaded.',
			});
		},
	}));
