import { extractCreateWorkspaceParams } from '$lib/stores/workspace-configs.svelte';
import { extractRedirectMessage } from '$lib/utils/redirects';

export function load({ url }) {
	const params = extractParams(url);
	return params;
}

function extractParams(url: URL) {
	const redirectMessage = extractRedirectMessage(url);

	if (redirectMessage) {
		return { params: { type: 'redirectMessage', redirectMessage } } as const;
	}

	const createWorkspaceParams = extractCreateWorkspaceParams(url);

	if (createWorkspaceParams) {
		return {
			params: { type: 'createWorkspaceParams', createWorkspaceParams },
		} as const;
	}

	return { params: null } as const;
}
