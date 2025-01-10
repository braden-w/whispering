import type { Recording } from '$lib/services/db';
import { DbService, createResultMutation } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';
import { Ok } from '@epicenterhq/result';
import { WhisperingErr, type WhisperingErrProperties } from '@repo/shared';
import { recordingsKeys } from './queries';
import { queryClient } from '$lib/services';
import { createMutation } from '@tanstack/svelte-query';

export const createRecording = createMutation(() => ({
	mutationFn: async (recording: Recording) => {
		const result = await DbService.updateRecording(recording);
		if (!result.ok) {
			return WhisperingErr({
				title: 'Failed to update recording!',
				description: 'Your recording could not be updated.',
				action: { type: 'more-details', error: result.error },
			});
		}

		queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
			if (!oldData) return [recording];
			return [...oldData, recording];
		});
		queryClient.setQueryData<Recording>(
			recordingsKeys.byId(recording.id),
			recording,
		);

		return Ok(recording);
	},
}));

export const updateRecordingWithToast = createResultMutation(() => ({
	mutationFn: async (recording: Recording) => {
		const result = await DbService.updateRecording(recording);
		if (!result.ok) {
			const e = WhisperingErr({
				title: 'Failed to update recording!',
				description: 'Your recording could not be updated.',
				action: { type: 'more-details', error: result.error },
			});
			toast.error(e.error);
			return e;
		}

		queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
			if (!oldData) return [recording];
			return oldData.map((item) =>
				item.id === recording.id ? recording : item,
			);
		});
		queryClient.setQueryData<Recording>(
			recordingsKeys.byId(recording.id),
			recording,
		);

		toast.success({
			title: 'Updated recording!',
			description: 'Your recording has been updated successfully.',
		});

		return Ok(recording);
	},
}));

export const deleteRecordingWithToast = createResultMutation(() => ({
	mutationFn: async (recording: Recording) => {
		const result = await DbService.deleteRecording(recording);
		if (!result.ok) {
			const e = WhisperingErr({
				title: 'Failed to delete recording!',
				description: 'Your recording could not be deleted.',
				action: { type: 'more-details', error: result.error },
			});
			toast.error(e.error);
			return e;
		}
		queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
			if (!oldData) return [];
			return oldData.filter((item) => item.id !== recording.id);
		});
		queryClient.removeQueries({ queryKey: recordingsKeys.byId(recording.id) });

		toast.success({
			title: 'Deleted recording!',
			description: 'Your recording has been deleted successfully.',
		});

		return Ok(recording);
	},
}));

export const deleteRecordingsWithToast = createResultMutation(() => ({
	mutationFn: async (recordings: Recording[]) => {
		const result = await DbService.deleteRecordings(recordings);
		if (!result.ok) {
			const e = WhisperingErr({
				title: 'Failed to delete recordings!',
				description: 'Your recordings could not be deleted.',
				action: { type: 'more-details', error: result.error },
			});
			toast.error(e.error);
			return e;
		}

		queryClient.setQueryData<Recording[]>(recordingsKeys.all, (oldData) => {
			if (!oldData) return [];
			const deletedIds = new Set(recordings.map((r) => r.id));
			return oldData.filter((item) => !deletedIds.has(item.id));
		});
		for (const recording of recordings) {
			queryClient.removeQueries({
				queryKey: recordingsKeys.byId(recording.id),
			});
		}

		toast.success({
			title: 'Deleted recordings!',
			description: 'Your recordings have been deleted successfully.',
		});

		return Ok(recordings);
	},
}));
