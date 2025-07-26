<script lang="ts">
	import '@repo/ui/app.css';
	import { queryClient } from '$lib/query/_client';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';

	import LayoutContent from './LayoutContent.svelte';

	let { children } = $props();
</script>

<QueryClientProvider client={queryClient}>
	<LayoutContent>
		{@render children()}
	</LayoutContent>
	<Toaster richColors position="top-right" />
	<SvelteQueryDevtools buttonPosition="bottom-right" />
	<ModeWatcher />
</QueryClientProvider>
