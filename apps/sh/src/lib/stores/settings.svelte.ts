import { createPersistedState } from '@repo/svelte-utils';
import { type } from 'arktype';

/**
 * Application settings that are persisted across sessions.
 * These settings provide default values for various features.
 */
const AppSettings = type({
	/**
	 * Default username for new workspace connections.
	 * This value is pre-populated when creating new workspaces.
	 */
	defaultUsername: 'string > 0',
	/**
	 * Default password for new workspace connections.
	 * This value is pre-populated when creating new workspaces.
	 */
	defaultPassword: 'string',
});

export type AppSettings = typeof AppSettings.infer;

/**
 * The reactive store containing application settings.
 * Automatically synced with localStorage under the key 'opencode-settings'.
 */
export const settings = createPersistedState({
	key: 'opencode-settings',
	schema: AppSettings,
	onParseError: (error) => {
		// Return default settings if anything goes wrong
		console.warn('Failed to load settings:', error);
		return {
			defaultUsername: 'user',
			defaultPassword: 'password',
		};
	},
	onUpdateError: (error) => {
		console.error('Failed to save settings:', error);
	},
});
