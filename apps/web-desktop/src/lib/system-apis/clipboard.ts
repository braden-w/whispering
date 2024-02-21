import { options } from '$lib/stores/options';
import { get } from 'svelte/store';

/**
 * Writes text to the user's clipboard.
 * @param text The text to write to the clipboard.
 */
export async function writeTextToClipboard(text: string): Promise<void> {
	if (!window.__TAURI__) return await navigator.clipboard.writeText(text);
	const { writeText } = await import('@tauri-apps/api/clipboard');
	return await writeText(text);
}

export async function pasteTextFromClipboard() {
	if (!window.__TAURI__) return;
	const { invoke } = await import('@tauri-apps/api/tauri');
	if (get(options).pasteContentsOnSuccess) invoke('paste');
}
