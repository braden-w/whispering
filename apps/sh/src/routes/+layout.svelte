<script lang="ts">
	import '@repo/ui/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '$lib/query/_client';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { Button } from '@repo/ui/button';
	import { page } from '$app/stores';
	import { Toaster } from 'svelte-sonner';
	import { User, Settings } from 'lucide-svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let { children } = $props();
	let settingsOpen = $state(false);
</script>

<QueryClientProvider client={queryClient}>
	<div class="relative min-h-screen bg-background">
		<!-- Header -->
		<header
			class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div class="mx-auto max-w-7xl px-4 sm:px-6">
				<div class="flex h-14 items-center">
					<div class="mr-4 flex">
						<a href="/" class="mr-4 flex items-center space-x-2 lg:mr-6">
							<span class="font-bold">epicenter.sh</span>
						</a>
						<nav class="flex items-center gap-4 text-sm lg:gap-6">
							<a
								href="/"
								class="transition-colors hover:text-foreground/80 {$page.url
									.pathname === '/'
									? 'text-foreground'
									: 'text-foreground/60'}"
							>
								Home
							</a>
							<a
								href="/workspaces"
								class="transition-colors hover:text-foreground/80 {$page.url.pathname.startsWith(
									'/workspaces',
								)
									? 'text-foreground'
									: 'text-foreground/60'}"
							>
								Workspaces
							</a>
						</nav>
					</div>
					<div class="flex flex-1 items-center justify-end space-x-2">
						<nav class="flex items-center gap-1">
							<Button variant="ghost" size="icon" onclick={() => settingsOpen = true}>
								<Settings class="h-4 w-4" />
								<span class="sr-only">Settings</span>
							</Button>
							<Button variant="ghost" size="icon">
								<User class="h-4 w-4" />
								<span class="sr-only">User account</span>
							</Button>
						</nav>
					</div>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="flex-1 mx-auto max-w-7xl">
			{@render children()}
		</main>
	</div>
	<Toaster richColors position="top-right" />
	<SvelteQueryDevtools buttonPosition="bottom-right" />
	<SettingsModal bind:open={settingsOpen} />
</QueryClientProvider>
