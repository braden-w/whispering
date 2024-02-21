<script lang="ts">
	// import '@repo/ui/app.pcss';
	import '../app.pcss';
	import { Toaster } from 'svelte-french-toast';
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { registerShortcut, unregisterAllShortcuts } from '$lib/system-apis/shortcuts';
	import { onMount, onDestroy } from 'svelte';
	import { options } from '$lib/stores/options';

	onMount(async () => await registerShortcut($options.currentGlobalShortcut, toggleRecording));
	onDestroy(async () => await unregisterAllShortcuts());
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<slot />
<Toaster />
