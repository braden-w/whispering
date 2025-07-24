<script lang="ts">
  import SignInWithGithubButton from './SignInWithGithubButton.svelte';

	import '@repo/ui/app.css';
	import { ModeWatcher } from "mode-watcher";
	import { page } from '$app/state';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import { queryClient } from '$lib/query/_client';
	import { Button } from '@repo/ui/button';
	import { LightSwitch } from '@repo/ui/light-switch';
	import * as DropdownMenu from '@repo/ui/dropdown-menu';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { Settings, User, } from 'lucide-svelte';
	import { Toaster } from 'svelte-sonner';
	import * as rpc from '$lib/query';
	import { createMutation } from '@tanstack/svelte-query';

	let { children } = $props();
	let settingsOpen = $state(false);

</script>

<QueryClientProvider client={queryClient}>
	<div class="relative min-h-screen bg-background">
		<!-- Header -->
		<header
			class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div class="mx-auto max-w-7xl px-4 sm:px-6 flex h-14 items-center">
				<div class="mr-4 flex">
					<a href="/" class="mr-4 flex items-center space-x-2 lg:mr-6">
						<span class="font-bold">epicenter.sh</span>
					</a>
					<nav class="flex items-center gap-4 text-sm lg:gap-6">
						<a
							href="/"
							class="transition-colors hover:text-foreground/80 {page.url.pathname === '/'
								? 'text-foreground'
								: 'text-foreground/60'}"
						>
							Home
						</a>
						<a
							href="/workspaces"
							class="transition-colors hover:text-foreground/80 {page.url.pathname.startsWith(
								'/workspaces',
							)
								? 'text-foreground'
								: 'text-foreground/60'}"
						>
							Workspaces
						</a>
					</nav>
				</div>
				<nav class="flex flex-1 items-center justify-end gap-1">
					<LightSwitch variant="ghost" />
					<Button
						variant="ghost"
						size="icon"
						onclick={() => (settingsOpen = true)}
					>
						<Settings class="h-4 w-4" />
						<span class="sr-only">Settings</span>
					</Button>
					
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="ghost" size="icon">
								<User class="h-4 w-4" />
								<span class="sr-only">User account</span>
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Label>Account</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<SignInWithGithubButton></SignInWithGithubButton>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</nav>
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

<ModeWatcher />