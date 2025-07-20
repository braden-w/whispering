import type { Workspace } from '$lib/stores/workspaces.svelte';
import { createClient, createConfig } from './client';
import type { ClientOptions } from './types.gen';
import { getProxiedBaseUrl } from './utils/proxy-url';

/**
 * Create an API client configured for a specific workspace
 */
export function createWorkspaceClient(workspace: Workspace) {
	// Create basic auth header
	const auth = btoa(`${workspace.username}:${workspace.password}`);

	// Create a new client with workspace-specific configuration
	return createClient(
		createConfig<ClientOptions>({
			baseUrl: getProxiedBaseUrl(workspace.url),
			headers: {
				Authorization: `Basic ${auth}`,
			},
		}),
	);
}
