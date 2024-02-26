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
	<slot />
</div>

<Toaster />
<ModeWatcher />
