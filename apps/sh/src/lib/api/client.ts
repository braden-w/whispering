import type { ApiType } from '@epicenter/api';

import { APPS } from '@repo/constants/vite';
import { hc } from 'hono/client';

export const apiClient = hc<ApiType>(APPS.API.URL, {
	init: { credentials: 'include' },
});
