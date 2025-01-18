<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import '../app.css';
	import { queryClient } from '$lib/query';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import GlobalSingletonsContext from './+layout/GlobalSingletonsContext.svelte';
	import AppShell from './+layout/AppShell.svelte';

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

<QueryClientProvider client={queryClient}>
	<GlobalSingletonsContext>
		<AppShell>
			{@render children()}
		</AppShell>
	</GlobalSingletonsContext>
</QueryClientProvider>
