import { createPersistedState } from '@repo/svelte-utils';
import { type } from 'arktype';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';

/**
 * Configuration for connecting to an OpenCode server instance.
 * This is what users define and we persist locally in the app.
 * Contains all the necessary credentials and connection details.
 *
 * Simplified architecture:
 * - port: The single port OpenCode runs on (with built-in CORS support)
 * - No more Caddy proxy needed for CORS
 * - Authentication handled at OpenCode level
 */
const WorkspaceConfig = type({
	id: 'string',
	name: 'string',
	url: 'string.url',
	port: '1 <= number.integer <= 65535',
	password: 'string',
	createdAt: 'number',
	lastAccessedAt: 'number',
});

export type WorkspaceConfig = typeof WorkspaceConfig.infer;

export type WorkspaceCreateInput = Omit<
	WorkspaceConfig,
	'id' | 'createdAt' | 'lastAccessedAt'
>;
export type WorkspaceUpdateInput = Partial<
	Omit<WorkspaceConfig, 'id' | 'createdAt'>
>;

/**
 * The reactive store containing all of the user's saved workspace configurations.
 * Automatically synced with localStorage under the key 'opencode-workspace-configs'.
 */
export const workspaceConfigs = createPersistedState({
	key: 'opencode-workspace-configs',
	schema: WorkspaceConfig.array(),
	onParseError: (error) => {
		if (error.type === 'storage_empty') {
			return []; // First time user
		}

		if (error.type === 'json_parse_error') {
			console.error('Corrupted workspace data:', error);
			toast.error('Failed to load workspaces', {
				description: 'Your workspace data appears to be corrupted',
			});
			return [];
		}

		if (error.type === 'schema_validation_failed') {
			console.warn('Invalid workspace data, attempting recovery and migration');
			// Try to recover and migrate valid workspaces
			if (Array.isArray(error.value)) {
				const migrated = error.value.map((w: any) => {
					// Migrate from old format if needed
					if ('privatePort' in w) {
						const { privatePort, publicPort, username, ...rest } = w;
						return {
							...rest,
							port: privatePort || 4096,
						};
					}
					return w;
				});
				
				const valid = migrated.filter((w) => {
					const result = WorkspaceConfig(w);
					if (result instanceof type.errors) return false;
					return true;
				});
				if (valid.length > 0) {
					toast.warning('Workspaces have been migrated to the new format');
					return valid;
				}
			}
		}

		return [];
	},
	onUpdateError: (error) => {
		console.error('Failed to save workspaces:', error);
		toast.error('Failed to save changes');
	},
});

// Check if a port is available by attempting to connect to it
export async function isPortAvailable(port: number): Promise<boolean> {
	try {
		// Try to fetch from localhost on the given port
		// If it fails with network error, the port is likely available
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

		await fetch(`http://localhost:${port}`, {
			signal: controller.signal,
			mode: 'no-cors', // Avoid CORS issues
		});
		clearTimeout(timeoutId);

		// If we get here, something is running on this port
		return false;
	} catch (error) {
		// Network error means port is likely available
		return true;
	}
}

// Generate an available port starting from 4096
export async function generateAvailablePort(): Promise<number> {
	let port = 4096;
	const maxPort = 65535;

	while (port <= maxPort) {
		if (await isPortAvailable(port)) {
			return port;
		}
		port++;
	}

	// Fallback to random if no ports available in range
	return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}

// Helper functions for workspace operations
export function createWorkspaceConfig(
	data: WorkspaceCreateInput,
): WorkspaceConfig {
	const newWorkspace: WorkspaceConfig = {
		...data,
		id: nanoid(),
		createdAt: Date.now(),
		lastAccessedAt: Date.now(),
	};

	workspaceConfigs.value = [...workspaceConfigs.value, newWorkspace];
	toast.success('Workspace created successfully');
	return newWorkspace;
}

export function updateWorkspaceConfig(
	id: string,
	updates: WorkspaceUpdateInput,
): void {
	workspaceConfigs.value = workspaceConfigs.value.map((w) => {
		if (w.id !== id) return w;

		return { ...w, ...updates, lastAccessedAt: Date.now() };
	});

	toast.success('Workspace updated');
}

export function deleteWorkspaceConfig(id: string): void {
	const workspace = getWorkspaceConfig(id);
	if (!workspace) {
		toast.error('Workspace not found');
		return;
	}

	workspaceConfigs.value = workspaceConfigs.value.filter((w) => w.id !== id);
	toast.success(`Deleted workspace "${workspace.name}"`);
}

export function getWorkspaceConfig(id: string): WorkspaceConfig | undefined {
	return workspaceConfigs.value.find((w) => w.id === id);
}
