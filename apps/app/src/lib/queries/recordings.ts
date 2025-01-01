import { DbService } from '$lib/services.svelte';

import { createQuery } from '@tanstack/svelte-query';

// Define the query key as a constant array
export const recordingsKeys = {
	all: ['recordings'] as const,
};

export const createRecordingsQuery = () =>
	createQuery(() => ({
		queryKey: recordingsKeys.all,
		queryFn: async () => {
			const result = await DbService.getAllRecordings();
			if (!result.ok) throw result.error;
			return result.data;
		},
	}));
