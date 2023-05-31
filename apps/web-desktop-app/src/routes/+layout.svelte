<script lang="ts">
	import { Toaster } from 'svelte-french-toast';
	import '../app.css';
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { registerShortcut, unregisterAllShortcuts } from '$lib/system-apis/shorcuts';
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
