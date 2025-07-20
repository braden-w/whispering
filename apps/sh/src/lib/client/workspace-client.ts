import { createClient, createConfig } from './client';
import type { ClientOptions } from './types.gen';
import type { Workspace } from '$lib/stores/workspaces.svelte';
import { decrypt } from '$lib/utils/encryption';

/**
 * Create an API client configured for a specific workspace
 */
export function createWorkspaceClient(workspace: Workspace) {
	// Decrypt the password
	const password = decrypt(workspace.password);
	
	// Create basic auth header
	const auth = btoa(`${workspace.username}:${password}`);
	
	// Create a new client with workspace-specific configuration
	return createClient(
		createConfig<ClientOptions>({
			baseUrl: workspace.url,
			headers: {
				'Authorization': `Basic ${auth}`,
			},
		})
	);
}