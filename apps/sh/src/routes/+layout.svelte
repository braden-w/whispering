<script lang="ts">
	import '@repo/ui/app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '$lib/query/_client';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { Button } from '@repo/ui/button';
	import { page } from '$app/stores';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-background">
		<header
			class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div class="container flex h-14 items-center">
				<div class="mr-4 flex">
					<a href="/" class="mr-6 flex items-center space-x-2">
						<span class="font-bold">epicenter.sh</span>
					</a>
					<nav class="flex items-center space-x-6 text-sm font-medium">
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
				<div class="flex-1" />
				<div class="flex items-center space-x-2">
					<Button variant="ghost" size="icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
							/>
						</svg>
					</Button>
				</div>
			</div>
		</header>
		<main class="container py-6">
			{@render children()}
		</main>
	</div>
	<Toaster richColors position="top-right" />
	<SvelteQueryDevtools buttonPosition="bottom-right" />
</QueryClientProvider>
