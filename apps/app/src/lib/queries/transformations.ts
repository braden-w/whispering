import { DbService } from '$lib/services.svelte';
import { createQuery } from '@tanstack/svelte-query';

// Define the query key as a constant array
export const transformationsKeys = {
	all: ['transformations'] as const,
};

export const createTransformationsQuery = () =>
	createQuery(() => ({
		queryKey: transformationsKeys.all,
		queryFn: async () => {
			const result = await DbService.getAllTransformations();
			if (!result.ok) throw result.error;
			return result.data;
		},
	}));
