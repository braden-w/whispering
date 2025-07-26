import * as rpc from '$lib/query';
import { redirect } from '@sveltejs/kit';

export async function load() {
	const { data, error } = await rpc.auth.getSession.ensure();
	if (error) redirect(302, '/');
	return { session: data };
}
