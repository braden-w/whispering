import { getCurrentWindow } from '@tauri-apps/api/window';
import { onDestroy, onMount } from 'svelte';
import { settings } from '$lib/stores/settings.svelte';
import type { UnlistenFn } from '@tauri-apps/api/event';

export function closeToTrayIfEnabled() {
	let unlisten: UnlistenFn;
	onMount(async () => {
		unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
			if (settings.value.closeToTray) {
				event.preventDefault();
				getCurrentWindow().hide();
			}
		});
	});

	onDestroy(() => {
		void unlisten();
	});
}
