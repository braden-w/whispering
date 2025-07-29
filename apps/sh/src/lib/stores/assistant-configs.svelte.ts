import { createPersistedState } from '@repo/svelte-utils';
import { type } from 'arktype';
import { nanoid } from 'nanoid';
import { toast } from 'svelte-sonner';

export const Password = type('string > 0#Password');
export type Password = typeof Password.infer;

export const Port = type('1024 <= number.integer <= 65535#Port');
export type Port = typeof Port.infer;

export const URL = type('string.url#URL');
export type URL = typeof URL.infer;

/**
 * Configuration for connecting to an OpenCode server instance.
 * This is what users define and we persist locally in the app.
 * Contains all the necessary credentials and connection details.
 *
 * Simplified architecture:
 * - URL includes the full address with port
 * - No more Caddy proxy needed for CORS
 * - Authentication handled at OpenCode level
 */
const AssistantConfig = type({
	createdAt: 'number',
	id: 'string',
	lastAccessedAt: 'number',
	name: 'string',
	password: [Password, '|', 'null'],
	url: URL,
});

export type AssistantConfig = typeof AssistantConfig.infer;

export const CreateAssistantParams = AssistantConfig.pick(
	'password',
	'url',
	'name',
);

export type CreateAssistantParams = typeof CreateAssistantParams.infer;

export const UpdateAssistantParams = AssistantConfig.omit(
	'id',
	'createdAt',
	'lastAccessedAt',
).partial();
export type UpdateAssistantParams = typeof UpdateAssistantParams.infer;

/**
 * The reactive store containing all of the user's saved assistant configurations.
 * Automatically synced with localStorage under the key 'opencode-assistant-configs'.
 */
export const assistantConfigs = (() => {
	const assistantConfigs = createPersistedState({
		key: 'opencode-assistant-configs',
		onParseError: (error) => {
			if (error.type === 'storage_empty') {
				return []; // First time user
			}

			if (error.type === 'json_parse_error') {
				console.error('Corrupted assistant data:', error);
				toast.error('Failed to load assistants', {
					description: 'Your assistant data appears to be corrupted',
				});
				return [];
			}

			if (error.type === 'schema_validation_failed') {
				console.warn(
					'Invalid assistant data, attempting recovery and migration',
				);
				// Try to recover and migrate valid assistants
				if (Array.isArray(error.value)) {
					const migrated = error.value.map((w) => {
						// Migrate from old format if needed
						if ('privatePort' in w || 'port' in w) {
							const { port, privatePort, publicPort, username, ...rest } = w;
							// Remove port fields during migration
							return rest;
						}
						return w;
					});

					const valid = migrated.filter((w) => {
						const result = AssistantConfig(w);
						if (result instanceof type.errors) return false;
						return true;
					});
					if (valid.length > 0) {
						toast.warning('Assistants have been migrated to the new format');
						return valid;
					}
				}
			}

			return [];
		},
		onUpdateError: (error) => {
			console.error('Failed to save assistants:', error);
			toast.error('Failed to save changes');
		},
		schema: AssistantConfig.array(),
	});

	return {
		create: (data: CreateAssistantParams) => {
			const newAssistant: AssistantConfig = {
				...data,
				createdAt: Date.now(),
				id: nanoid(),
				lastAccessedAt: Date.now(),
			};

			assistantConfigs.value = [...assistantConfigs.value, newAssistant];
			toast.success('Assistant created successfully');
			return newAssistant;
		},
		delete: (id: string) => {
			assistantConfigs.value = assistantConfigs.value.filter(
				(w) => w.id !== id,
			);
			toast.success('Assistant deleted successfully');
		},
		getById: (id: string) => {
			return assistantConfigs.value.find((w) => w.id === id);
		},
		update: (id: string, data: UpdateAssistantParams) => {
			assistantConfigs.value = assistantConfigs.value.map((w) =>
				w.id === id ? { ...w, ...data, lastAccessedAt: Date.now() } : w,
			);
			toast.success('Assistant updated successfully');
		},
		get value() {
			return assistantConfigs.value;
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
async function isPortAvailable(port: Port): Promise<boolean> {
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
