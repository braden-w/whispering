import type { Recording } from '$lib/services/db';
import { DbRecordingsService } from '$lib/services/index.js';
import { queryClient } from '$lib/query';
import { toast } from '$lib/services/toast';
import { createQuery } from '@tanstack/svelte-query';
import type { Accessor } from '../types';

// Define the query key as a constant array
export const recordingsKeys = {
	all: ['recordings'] as const,
	byId: (id: string) => [...recordingsKeys.all, id] as const,
};

export const useRecordingsQuery = () =>
	createQuery(() => ({
		queryKey: recordingsKeys.all,
		queryFn: async () => {
			const result = await DbRecordingsService.getAllRecordings();
			if (!result.ok) {
				toast.error({
					title: 'Failed to fetch recordings!',
					description: 'Your recordings could not be fetched.',
					action: { type: 'more-details', error: result.error },
				});
				throw result.error;
			}
			return result.data;
		},
	}));

export const useRecordingQuery = (id: Accessor<string>) =>
	createQuery(() => ({
		queryKey: recordingsKeys.byId(id()),
		queryFn: async () => {
			const result = await DbRecordingsService.getRecordingById(id());
			if (!result.ok) {
				toast.error({
					title: 'Failed to fetch recording!',
					description: 'Your recording could not be fetched.',
					action: { type: 'more-details', error: result.error },
				});
				throw result.error;
			}
			return result.data;
		},
		initialData: () =>
			queryClient
				.getQueryData<Recording[]>(recordingsKeys.all)
				?.find((r) => r.id === id()),
		initialDataUpdatedAt: () =>
			queryClient.getQueryState(recordingsKeys.all)?.dataUpdatedAt,
	}));
