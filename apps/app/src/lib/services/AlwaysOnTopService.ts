import { settings } from '$lib/stores/settings.svelte';
import { getCurrentWindow } from '@tauri-apps/api/window';

export const setAlwaysOnTop = async (value: boolean) => {
	if (!window.__TAURI_INTERNALS__) return;
	await getCurrentWindow().setAlwaysOnTop(value);
};

export const setAlwaysOnTopToTrueIfInSettings = async () => {
	if (settings.value.alwaysOnTop === 'Always') {
		await setAlwaysOnTop(true);
	} else {
		await setAlwaysOnTop(false);
	}
};
