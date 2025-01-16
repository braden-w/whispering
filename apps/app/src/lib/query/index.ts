import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/query-core';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			enabled: browser,
		},
	},
});
