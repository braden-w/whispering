export async function registerShortcut(currentShortcut: string, command: () => Promise<void>) {
	if (!window.__TAURI__) return;
	const { register, unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
	await register(currentShortcut, command);
}

export async function unregisterAllShortcuts() {
	if (!window.__TAURI__) return;
	const { unregisterAll } = await import('@tauri-apps/api/globalShortcut');
	await unregisterAll();
}
