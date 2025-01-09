import type { Recording } from '$lib/services/db';
import { DbService, queryClient } from '$lib/services/index.js';
import { toast } from '$lib/services/toast';

import { createQuery } from '@tanstack/svelte-query';

// Define the query key as a constant array
export const recordingsKeys = {
	all: ['recordings'] as const,
	byId: (id: string) => [...recordingsKeys.all, id] as const,
};

export const createRecordingsQuery = () =>
	createQuery(() => ({
		queryKey: recordingsKeys.all,
		queryFn: async () => {
			const result = await DbService.getAllRecordings();
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

export const createRecordingQuery = (id: string) =>
	createQuery(() => ({
		queryKey: recordingsKeys.byId(id),
		queryFn: async () => {
			const result = await DbService.getRecordingById(id);
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
				?.find((r) => r.id === id),
		initialDataUpdatedAt: () =>
			queryClient.getQueryState(recordingsKeys.all)?.dataUpdatedAt,
	}));
