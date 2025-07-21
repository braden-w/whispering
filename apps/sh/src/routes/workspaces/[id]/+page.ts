import type { PageLoad } from './$types';
import * as rpc from '$lib/query';
import { queryClient } from '$lib/query/_client';
import { redirect } from '@sveltejs/kit';
import { getWorkspaceConfig } from '$lib/stores/workspace-configs.svelte';

export const load: PageLoad = async ({ params }) => {
	const workspaceConfig = getWorkspaceConfig(params.id);

	if (!workspaceConfig) redirect(302, '/workspaces');

	const sessions = await queryClient.ensureQueryData(
		rpc.sessions.getSessions(() => workspaceConfig).options(),
	);

	if (!sessions) redirect(302, '/workspaces');

	return { workspaceConfig, sessions };
};
