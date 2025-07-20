import { createPersistedState } from '@repo/svelte-utils';
import { type } from 'arktype';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';

/**
 * Configuration for connecting to an OpenCode server instance.
 * This is what users define and we persist locally in the app.
 * Contains all the necessary credentials and connection details.
 */
const WorkspaceConfig = type({
	id: 'string',
	name: 'string',
	url: 'string.url',
	port: '1 <= number.integer <= 65535',
	username: 'string > 0',
	password: 'string',
	createdAt: 'number',
	lastUsedAt: 'number',
});

export type WorkspaceConfig = typeof WorkspaceConfig.infer;

export type WorkspaceCreateInput = Omit<
	WorkspaceConfig,
	'id' | 'createdAt' | 'lastUsedAt'
>;
export type WorkspaceUpdateInput = Partial<Omit<WorkspaceConfig, 'id' | 'createdAt'>>;

/**
 * The reactive store containing all your saved workspace connection profiles.
 * Automatically synced with localStorage under the key 'opencode-workspaces'.
 * 
 * Use workspaces.value to access the array of saved connection settings.
 */
export const workspaces = createPersistedState({
	key: 'opencode-workspaces',
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
			console.warn('Invalid workspace data, attempting recovery');
			// Try to recover valid workspaces
			if (Array.isArray(error.value)) {
				const valid = error.value.filter((w) => {
					const result = WorkspaceConfig(w);
					if (result instanceof type.errors) return false;
					return true;
				});
				if (valid.length > 0) {
					toast.warning('Some workspaces could not be loaded');
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

// Helper function to generate a random port in the safe range
export function generateRandomPort(): number {
	return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}

// Helper functions for workspace operations
export function createWorkspace(data: WorkspaceCreateInput): WorkspaceConfig {
	const newWorkspace: WorkspaceConfig = {
		...data,
		id: nanoid(),
		createdAt: Date.now(),
		lastUsedAt: Date.now(),
	};

	workspaces.value = [...workspaces.value, newWorkspace];
	toast.success('Workspace created successfully');
	return newWorkspace;
}

export function updateWorkspace(
	id: string,
	updates: WorkspaceUpdateInput,
): void {
	workspaces.value = workspaces.value.map((w) => {
		if (w.id !== id) return w;

		return { ...w, ...updates, lastUsedAt: Date.now() };
	});

	toast.success('Workspace updated');
}

export function deleteWorkspace(id: string): void {
	const workspace = getWorkspace(id);
	if (!workspace) {
		toast.error('Workspace not found');
		return;
	}

	workspaces.value = workspaces.value.filter((w) => w.id !== id);
	toast.success(`Deleted workspace "${workspace.name}"`);
}

export function getWorkspace(id: string): WorkspaceConfig | undefined {
	return workspaces.value.find((w) => w.id === id);
}
