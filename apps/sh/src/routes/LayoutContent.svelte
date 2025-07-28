<script lang="ts">
	import { page } from '$app/state';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import * as rpc from '$lib/query';
	import { Button } from '@repo/ui/button';
	import * as DropdownMenu from '@repo/ui/dropdown-menu';
	import { LightSwitch } from '@repo/ui/light-switch';
	import { createMutation } from '@tanstack/svelte-query';
	import { Loader2, LogOut, Settings, User } from 'lucide-svelte';
	import { siGithub } from 'simple-icons';

	let { children } = $props();
	let settingsOpen = $state(false);

	const signInWithGithubMutation = createMutation(
		rpc.auth.signInWithGithub.options,
	);
	const signOut = createMutation(rpc.auth.signOut.options);
</script>

<div class="relative min-h-screen bg-background">
	<!-- Header -->
	<header
		class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="px-4 sm:px-6 flex h-14 items-center">
			<div class="mr-4 flex">
				<a href="/" class="mr-4 flex items-center space-x-2 lg:mr-6">
					<span class="font-bold">epicenter.sh</span>
				</a>
				<nav class="flex items-center gap-4 text-sm lg:gap-6">
					<a
						href="/"
						class="transition-colors hover:text-foreground/80 {page.url
							.pathname === '/'
							? 'text-foreground'
							: 'text-foreground/60'}"
					>
						Home
					</a>
					<a
						href="/assistants"
						class="transition-colors hover:text-foreground/80 {page.url.pathname.startsWith(
							'/assistants',
						)
							? 'text-foreground'
							: 'text-foreground/60'}"
					>
						Assistants
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
						<DropdownMenu.Item
							class="cursor-pointer"
							onclick={() => signInWithGithubMutation.mutate()}
						>
							{#if signInWithGithubMutation.isPending}
								<Loader2 class="animate-spin" />
							{:else}
								<span class="dark:invert">
									{@html siGithub.svg}
								</span>
								Sign in with GitHub
							{/if}
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<Button
								variant="ghost"
								size="icon"
								onclick={() => signOut.mutate()}
							>
								{#if signOut.isPending}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<LogOut class="h-4 w-4" />
								{/if}
								<span class="sr-only">Sign out</span>
							</Button>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</nav>
		</div>
	</header>

	<!-- Main Content -->
	<main class="flex-1">
		{@render children()}
	</main>
</div>

<SettingsModal bind:open={settingsOpen} />
