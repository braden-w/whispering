/**
 * Registers a shortcut for the app.
 * @param currentShortcut The shortcut to be registered.
 * @param command The command to be executed when the shortcut is triggered.
 */
export async function registerShortcut(currentShortcut: string, command: () => Promise<void>) {
	if (!window.__TAURI__) return;
	const { register, unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
	await register(currentShortcut, command);
}

/**
 * Unregisters all shortcuts for the app.
 */
export async function unregisterAllShortcuts() {
	if (!window.__TAURI__) return;
	const { unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
}
