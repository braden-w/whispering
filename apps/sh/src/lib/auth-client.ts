import { createAuthClient } from 'better-auth/client';
import { APPS } from '@repo/constants';

export const authClient = createAuthClient({
	baseURL: APPS(import.meta.env).AUTH.URL,
	fetchOptions: {
		credentials: 'include',
	},
});
