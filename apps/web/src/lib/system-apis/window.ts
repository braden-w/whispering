/**
 * Sets whether the window is always on top of other windows.
 * @param alwaysOnTop Whether the window should be always on top of other windows.
 */
export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
	if (!window.__TAURI__) return;
	const { appWindow } = await import('@tauri-apps/api/window');
	await appWindow.setAlwaysOnTop(alwaysOnTop);
}
