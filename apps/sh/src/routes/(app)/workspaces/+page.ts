import { CreateWorkspaceParams } from '$lib/stores/workspace-configs.svelte';
import { extractRedirectMessage } from '$lib/utils/redirects';
import { type } from 'arktype';

import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const redirectMessage = extractRedirectMessage(url);

	const port = url.searchParams.get('port');
	const workspaceUrl = url.searchParams.get('url');
	const password = url.searchParams.get('password');
	const name = url.searchParams.get('name');

	const validated = CreateWorkspaceParams({
		name,
		password,
		port: port ? Number.parseInt(port, 10) : null,
		url: workspaceUrl,
	});

	if (validated instanceof type.errors) {
		return {
			createWorkspaceParams: null,
			redirectMessage,
		};
	}

	return {
		createWorkspaceParams: validated,
		redirectMessage,
	};
};
