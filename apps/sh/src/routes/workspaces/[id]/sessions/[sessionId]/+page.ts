import { getWorkspaceConfig } from '$lib/stores/workspace-configs.svelte';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const workspaceConfig = getWorkspaceConfig(params.id);

	if (!workspaceConfig) redirect(302, '/workspaces');

	return {
		workspaceConfig,
		sessionId: params.sessionId,
	};
};
