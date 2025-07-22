import {
	CreateWorkspaceParams,
	createWorkspaceConfig,
} from '$lib/stores/workspace-configs.svelte';
import type { PageLoad } from './$types';

import { type } from 'arktype';

export const load: PageLoad = ({ url }) => {
	const port = url.searchParams.get('port');
	const workspaceUrl = url.searchParams.get('url');
	const password = url.searchParams.get('password');
	const name = url.searchParams.get('name');

	const validated = CreateWorkspaceParams({
		port: port ? Number.parseInt(port, 10) : null,
		url: workspaceUrl,
		password,
		name,
	});

	if (validated instanceof type.errors) return { createWorkspaceParams: null };

	return { createWorkspaceParams: validated };
};
