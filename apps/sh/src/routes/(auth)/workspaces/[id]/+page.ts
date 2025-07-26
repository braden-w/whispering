import * as rpc from '$lib/query';
import { queryClient } from '$lib/query/_client';
import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const workspaceConfig = workspaceConfigs.getById(params.id);

	if (!workspaceConfig) redirect(302, '/workspaces');

	const sessions = await queryClient.ensureQueryData(
		rpc.sessions.getSessions(() => workspaceConfig).options(),
	);

	if (!sessions) redirect(302, '/workspaces');

	return { sessions, workspaceConfig };
};
