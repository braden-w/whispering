import type { PageLoad } from './$types';
import * as rpc from '$lib/query';
import { queryClient } from '$lib/query/_client';

export const load: PageLoad = async () => {
	// Prefetch sessions on the server
	await queryClient.prefetchQuery(rpc.sessions.getSessions.options());

	return {};
};
