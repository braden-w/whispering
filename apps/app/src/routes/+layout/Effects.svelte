<script lang="ts">
	import { goto } from '$app/navigation';
	import { DbRecordingsService } from '$lib/services';
	import { getRecorderFromContext } from '$lib/stores/recorder.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { extension } from '@repo/extension';
	import { onMount } from 'svelte';
	import { syncWindowAlwaysOnTopWithRecorderState } from './alwaysOnTop.svelte';
	import { closeToTrayIfEnabled } from './closeToTrayIfEnabled';

	const recorder = getRecorderFromContext();

	syncWindowAlwaysOnTopWithRecorderState();
	closeToTrayIfEnabled();

	$effect(() => {
		recorder.recorderState;
		void DbRecordingsService.cleanupExpiredRecordings(settings.value);
	});

	onMount(async () => {
		window.recorder = recorder;
		window.goto = goto;
		if (!window.__TAURI_INTERNALS__) {
			const _notifyWhisperingTabReadyResult =
				await extension.notifyWhisperingTabReady(undefined);
		}
	});

	let { children } = $props();
</script>

{@render children()}
