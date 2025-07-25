<script lang="ts">
	import '@repo/ui/app.css';
  import LayoutContent from './LayoutContent.svelte';
	import { queryClient } from '$lib/query/_client';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from 'svelte-sonner';

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
