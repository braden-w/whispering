import * as rpc from '$lib/query';
import { workspaceConfigs } from '$lib/stores/workspace-configs.svelte';
import { redirect } from '@sveltejs/kit';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const workspaceConfig = workspaceConfigs.getById(params.id);

	if (!workspaceConfig) redirect(302, '/workspaces');

	const { data: sessions, error } = await rpc.sessions
		.getSessions(() => workspaceConfig)
		.ensure();

	if (error) redirect(302, '/workspaces');

	return { sessions, workspaceConfig };
};
