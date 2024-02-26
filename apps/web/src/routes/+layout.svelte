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

<style>
	:global(::view-transition-new(root)) {
		animation-duration: 150ms;
	}

	/* @keyframes slide-to-left {
		to {
			transform: translateX(-100%);
		}
	}

	@keyframes slide-from-right {
		from {
			transform: translateX(100%);
		}
	}

	:root::view-transition-old(root) {
		animation: 90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
			300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
	}

	:root::view-transition-new(root) {
		animation: 210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
			300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
	}

	:root::view-transition-old(header) {
		animation: none;
	}

	:root::view-transition-new(header) {
		animation: none;
	} */
</style>
