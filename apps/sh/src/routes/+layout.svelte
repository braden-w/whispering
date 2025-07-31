<script lang="ts">
	import '@repo/ui/app.css';
	import { page } from '$app/state';
	import { queryClient } from '$lib/query/_client';
	import { useFlashMessage } from '$lib/utils/search-params.svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';

	import LayoutContent from './LayoutContent.svelte';

	let { children } = $props();

	// Listen for flash messages in the URL
	useFlashMessage(page.url);
</script>

<QueryClientProvider client={queryClient}>
	<LayoutContent>
		{@render children()}
	</LayoutContent>
</QueryClientProvider>

<Toaster richColors position="top-right" />
<ModeWatcher />
<SvelteQueryDevtools client={queryClient} buttonPosition="bottom-right" />
