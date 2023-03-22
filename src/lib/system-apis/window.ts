export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
	if (!window.__TAURI__) return;
	const { appWindow } = await import('@tauri-apps/api/window');
	await appWindow.setAlwaysOnTop(alwaysOnTop);
}
