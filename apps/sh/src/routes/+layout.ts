import { queryClient } from '$lib/query/_client.js';
import * as rpc from '$lib/query';

export const ssr = false;

export const load = async () => {
	const session = await queryClient.ensureQueryData(
		rpc.auth.getSession.options(),
	);
	return { session };
};
