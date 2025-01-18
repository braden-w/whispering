<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { queryClient } from '$lib/query';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import '../app.css';
	import Services from './+layout/Services.svelte';
	import { syncWindowAlwaysOnTopWithRecorderState } from './+layout/alwaysOnTop.svelte';
	import { closeToTrayIfEnabled } from './+layout/closeToTray';

	let { children } = $props();

	syncWindowAlwaysOnTopWithRecorderState();
	closeToTrayIfEnabled();

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

<QueryClientProvider client={queryClient}>
	<Services>{@render children()}</Services>
</QueryClientProvider>
