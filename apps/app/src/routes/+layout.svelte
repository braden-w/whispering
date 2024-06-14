<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { Toaster } from '$lib/components/ui/sonner';
	import { settings } from '$lib/stores';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.pcss';

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
	<slot />
</div>

<Toaster {...settings.toast} />
<ModeWatcher />
