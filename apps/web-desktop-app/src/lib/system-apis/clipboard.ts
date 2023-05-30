/**
 * Writes text to the user's clipboard.
 * @param text The text to write to the clipboard.
 */
export async function writeText(text: string): Promise<void> {
	if (window.__TAURI__) {
		const { writeText } = await import('@tauri-apps/api/clipboard');
		return await writeText(text);
	}
	return await navigator.clipboard.writeText(text);
}
