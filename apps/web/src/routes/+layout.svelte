<script lang="ts">
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
		class="border-border/4 bg-background/95 supports-[backdrop-filter]:bg-background/6t0 sticky top-0 z-50 border-b shadow-sm backdrop-blur"
	>
		<div class="flex h-[50px] items-center justify-between px-4 md:px-6">
			<div class="flex items-center gap-2 text-lg font-semibold">
				<span class="font-bold">whispering</span>
				<span aria-hidden="true" role="img"> 🎙️ </span>
			</div>
			<div class="flex items-center gap-4">
				<Button size="icon" variant="ghost">
					<SettingsIcon class="h-5 w-5" />
					<span class="sr-only">Settings</span>
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
