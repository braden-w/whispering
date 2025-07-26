import * as rpc from '$lib/query';
import { queryClient } from '$lib/query/_client.js';

export async function load() {
	const session = await queryClient.ensureQueryData(
		rpc.auth.getSession.options(),
	);
	return { session };
}
