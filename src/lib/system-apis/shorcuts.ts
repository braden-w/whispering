/**
 * Registers a shortcut for the app.
 * @param currentShortcut The shortcut to be registered.
 * @param command The command to be executed when the shortcut is triggered.
 */

export async function registerShortcut(currentShortcut: string, command: () => Promise<void>) {
	if (!window.__TAURI__) return;
	const { register, unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
	// Register the new shortcut. If it takes more than 1 second, assume an error and reject the promise.
	const timeoutPromise = new Promise<void>((_, reject) => {
		setTimeout(() => {
			reject(new Error('Timeout: operation took more than 1 second'));
		}, 1000);
	});
	await Promise.race([register(currentShortcut, command), timeoutPromise]);
}

/**
 * Unregisters all shortcuts for the app.
 */
export async function unregisterAllShortcuts() {
	if (!window.__TAURI__) return;
	const { unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
}
