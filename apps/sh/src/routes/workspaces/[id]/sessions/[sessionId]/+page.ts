import { getWorkspace } from '$lib/stores/workspaces.svelte';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const workspace = getWorkspace(params.id);

	if (!workspace) redirect(302, '/workspaces');

	return {
		workspace,
		sessionId: params.sessionId,
	};
};
