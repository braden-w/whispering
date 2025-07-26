import { queryClient } from '$lib/query/_client.js';
import * as rpc from '$lib/query';

export async function load() {
	const session = await queryClient.ensureQueryData(
		rpc.auth.getSession.options(),
	);
	return { session };
}
