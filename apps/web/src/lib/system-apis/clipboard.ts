import { options } from '$lib/stores/options';
import { get } from 'svelte/store';

/**
 * Writes text to the user's clipboard.
 * @param text The text to write to the clipboard.
 */
export async function writeTextToClipboard(text: string): Promise<void> {
	return await navigator.clipboard.writeText(text);
}

export async function pasteTextFromClipboard() {
	return;
}
