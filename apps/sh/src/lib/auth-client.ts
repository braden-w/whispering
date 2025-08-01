import { APPS } from '@repo/constants/vite';
import { createAuthClient } from 'better-auth/client';
import { anonymousClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	baseURL: APPS.API.URL,
	basePath: '/auth',
	fetchOptions: {
		credentials: 'include',
	},
	plugins: [anonymousClient()],
});
