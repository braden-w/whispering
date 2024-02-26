<script lang="ts">
	import '@repo/ui/app.pcss';
	import { ModeWatcher, Toaster } from '@repo/ui/components/sonner';
	import { setupViewTransition } from 'sveltekit-view-transition';
	import NavItems from './NavItems.svelte';

	setupViewTransition();

	// onMount(async () => await registerShortcut($options.currentGlobalShortcut, toggleRecording));
	// onDestroy(async () => await unregisterAllShortcuts());
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<header
		class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b shadow-sm backdrop-blur"
		style="view-transition-name: header"
	>
		<div class="container flex h-14 w-full max-w-screen-2xl items-center justify-between">
			<a class="flex items-center gap-2" href="/">
				<span aria-hidden="true" role="img"> 🎙️ </span>
				<span class="text-lg font-bold">whispering</span>
			</a>
			<NavItems />
		</div>
	</header>
	<main class="flex flex-1 justify-center p-4">
		<slot />
	</main>
</div>

<Toaster />
<ModeWatcher />
