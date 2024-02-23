<script lang="ts">
	import GithubIcon from '~icons/mdi/github';
	import AdjustmentsHorizontalIcon from '~icons/heroicons/adjustments-horizontal';
	import '@repo/ui/app.pcss';
	import { Button } from '@repo/ui/components/button';
	import { ModeWatcher, Toaster, toggleMode } from '@repo/ui/components/sonner';
	import MoonIcon from '~icons/lucide/moon';
	import SunIcon from '~icons/lucide/sun';
	import SettingsIcon from '~icons/mdi/settings';

	// onMount(async () => await registerShortcut($options.currentGlobalShortcut, toggleRecording));
	// onDestroy(async () => await unregisterAllShortcuts());
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<header
		class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur"
	>
		<div class="container flex h-14 w-full max-w-screen-2xl items-center justify-between">
			<div class="flex items-center gap-2 text-lg font-semibold">
				<span aria-hidden="true" role="img"> 🎙️ </span>
				<span class="font-bold">whispering</span>
			</div>
			<div class="flex items-center gap-4">
				<Button href="/settings" aria-label="Settings" variant="ghost" size="icon">
					<AdjustmentsHorizontalIcon />
					<span class="sr-only">Settings</span>
				</Button>
				<Button
					href="https://github.com/braden-w/whispering"
					target="_blank"
					rel="noopener noreferrer"
					title="View project on GitHub"
					aria-label="View project on GitHub"
					size="icon"
					variant="ghost"
				>
					<GithubIcon class="h-4 w-4" />
				</Button>
				<Button on:click={toggleMode} size="icon" variant="ghost">
					<SunIcon
						class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					/>
					<MoonIcon
						class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					/>
					<span class="sr-only">Toggle dark mode</span>
				</Button>
			</div>
		</div>
	</header>
	<main class="flex flex-1 items-center justify-center p-4">
		<slot />
	</main>
</div>

<Toaster />
<ModeWatcher />
