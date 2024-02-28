<script lang="ts">
	import '@repo/ui/app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-french-toast';
	import { setupViewTransition } from 'sveltekit-view-transition';

	setupViewTransition();
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<slot />
</div>

<Toaster position="bottom-right" />
<ModeWatcher />
