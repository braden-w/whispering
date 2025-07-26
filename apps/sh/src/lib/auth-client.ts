import { APPS } from '@repo/constants';
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
	baseURL: APPS(import.meta.env).AUTH.URL,
	fetchOptions: {
		credentials: 'include',
	},
});
