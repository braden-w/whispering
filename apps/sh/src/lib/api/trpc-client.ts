import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@epicenter/api';
import { APPS } from '@repo/constants/vite';

export const trpc = createTRPCClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${APPS.API.URL}/trpc`,
			fetch(url, options) {
				return fetch(url, {
					...options,
					credentials: 'include',
				});
			},
		}),
	],
});
