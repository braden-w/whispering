import { goto } from '$app/navigation';
import { createPersistedState } from '@repo/svelte-utils';
import { type } from 'arktype';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';

export const Password = type('string > 0#Password');
export type Password = typeof Password.infer;

export const Port = type('1024 <= number.integer <= 65535#Port');
export type Port = typeof Port.infer;

export const URL = type('string.url#URL');

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
	createdAt: 'number',
	id: 'string',
	lastAccessedAt: 'number',
	name: 'string',
	password: [Password, '|', 'null'],
	port: Port,
	url: URL,
});

export type WorkspaceConfig = typeof WorkspaceConfig.infer;

export const CreateWorkspaceParams = WorkspaceConfig.pick(
	'password',
	'port',
	'url',
	'name',
);

export type CreateWorkspaceParams = typeof CreateWorkspaceParams.infer;

/**
 * Hook that monitors URL parameters for workspace creation data,
 * creates the workspace if valid parameters are found, and cleans the URL.
 *
 * This hook enables deep linking for workspace creation, allowing users to share
 * pre-configured workspace links that automatically create workspaces on load.
 *
 * @param url - The reactive URL object from $page.url
 *
 * @example
 * ```svelte
 * import { page } from '$app/state';
 * import { useCreateWorkspaceParams } from '$lib/stores/workspace-configs.svelte';
 *
 * useCreateWorkspaceParams(page.url);
 * ```
 */
export function useCreateWorkspaceParams(url: URL) {
	$effect(() => {
		const port = url.searchParams.get('port');
		const workspaceUrl = url.searchParams.get('url');
		const password = url.searchParams.get('password');
		const name = url.searchParams.get('name');

		const workspace = CreateWorkspaceParams({
			name,
			password,
			port: port ? Number.parseInt(port, 10) : null,
			url: workspaceUrl,
		});
		if (workspace instanceof type.errors) return;
		workspaceConfigs.create(workspace);

		// Clean URL without navigation by replacing the current history entry
		const cleanUrl = new URL(url);
		cleanUrl.searchParams.delete('port');
		cleanUrl.searchParams.delete('url');
		cleanUrl.searchParams.delete('password');
		cleanUrl.searchParams.delete('name');

		goto(`${cleanUrl.pathname}${cleanUrl.search}`, {
			replaceState: true,
			noScroll: true,
		});
	});
}

export const UpdateWorkspaceParams = WorkspaceConfig.omit(
	'id',
	'createdAt',
	'lastAccessedAt',
).partial();
export type UpdateWorkspaceParams = typeof UpdateWorkspaceParams.infer;

/**
 * The reactive store containing all of the user's saved workspace configurations.
 * Automatically synced with localStorage under the key 'opencode-workspace-configs'.
 */
export const workspaceConfigs = (() => {
	const workspaceConfigs = createPersistedState({
		key: 'opencode-workspace-configs',
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
				console.warn(
					'Invalid workspace data, attempting recovery and migration',
				);
				// Try to recover and migrate valid workspaces
				if (Array.isArray(error.value)) {
					const migrated = error.value.map((w) => {
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
		schema: WorkspaceConfig.array(),
	});

	return {
		create: (data: CreateWorkspaceParams) => {
			const newWorkspace: WorkspaceConfig = {
				...data,
				createdAt: Date.now(),
				id: nanoid(),
				lastAccessedAt: Date.now(),
			};

			workspaceConfigs.value = [...workspaceConfigs.value, newWorkspace];
			toast.success('Workspace created successfully');
			return newWorkspace;
		},
		delete: (id: string) => {
			workspaceConfigs.value = workspaceConfigs.value.filter(
				(w) => w.id !== id,
			);
			toast.success('Workspace deleted successfully');
		},
		getById: (id: string) => {
			return workspaceConfigs.value.find((w) => w.id === id);
		},
		update: (id: string, data: UpdateWorkspaceParams) => {
			workspaceConfigs.value = workspaceConfigs.value.map((w) =>
				w.id === id ? { ...w, ...data, lastAccessedAt: Date.now() } : w,
			);
			toast.success('Workspace updated successfully');
		},
		get value() {
			return workspaceConfigs.value;
		},
	};
})();

// Generate an available port starting from 4096
export async function generateAvailablePort(): Promise<Port> {
	const MIN_PORT = 1024;
	const MAX_PORT = 65535;
	const PREFERRED_START = 4096;

	// First, try ports from 4096 upwards to 65535
	for (let port = PREFERRED_START; port <= MAX_PORT; port++) {
		if (await isPortAvailable(port as Port)) {
			return port as Port;
		}
	}

	// If no ports found in preferred range, try lower ports from 1024 to 4095
	for (let port = MIN_PORT; port < PREFERRED_START; port++) {
		if (await isPortAvailable(port as Port)) {
			return port as Port;
		}
	}

	// Fallback to preferred start if no ports are available (unlikely)
	return PREFERRED_START as Port;
}

// Check if a port is available by attempting to connect to it
export async function isPortAvailable(port: Port): Promise<boolean> {
	try {
		// Try to fetch from localhost on the given port
		// If it fails with network error, the port is likely available
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout

		await fetch(`http://localhost:${port}`, {
			mode: 'no-cors', // Avoid CORS issues
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		// If we get here, something is running on this port
		return false;
	} catch (error) {
		// Network error means port is likely available
		return true;
	}
}
