<script lang="ts">
	import '@repo/ui/app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '@repo/ui/components/sonner';
	import { onNavigate } from '$app/navigation';
	import { recorder } from '$lib/stores/recorder';
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { Effect } from 'effect';

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(async () => {
		const { register } = await import('@tauri-apps/api/globalShortcut');
		await register(settings.currentGlobalShortcut, () =>
			recorder.toggleRecording.pipe(Effect.runPromise),
		);
	});
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<slot />
</div>

<Toaster position="bottom-right" />
<ModeWatcher />
