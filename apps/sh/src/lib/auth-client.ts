import { APPS } from '@repo/constants/vite';
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
	baseURL: APPS.API.URL,
	fetchOptions: {
		credentials: 'include',
	},
});
