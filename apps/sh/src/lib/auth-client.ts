import { createAuthClient } from 'better-auth/client';
import { APPS } from '@repo/constants';

export const authClient = createAuthClient({
	baseURL: APPS({ ENVIRONMENT: import.meta.env.MODE }).AUTH.URL,
	fetchOptions: {
		credentials: 'include',
	},
});
