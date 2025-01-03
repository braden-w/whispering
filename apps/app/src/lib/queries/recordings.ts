import { DbService } from '$lib/services.svelte';
import { toast } from '$lib/utils/toast';

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
