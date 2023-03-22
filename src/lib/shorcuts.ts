import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';

export async function registerShortcut(currentShortcut: string, command: () => Promise<void>) {
	await unregisterAll();
	await register(currentShortcut, command);
}
