import { hc } from 'hono/client';
import type { ApiType } from '@epicenter/api';
import { APPS } from '@repo/constants/vite';

export const apiClient = hc<ApiType>(APPS.API.URL, {
	init: { credentials: 'include' },
});
