<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import '@repo/ui/app.pcss';
	import { Toaster } from '@repo/ui/components/sonner';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	{@render children()}
</div>

<Toaster position="bottom-right" />
<ModeWatcher />
