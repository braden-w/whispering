<script lang="ts">
	import { toggleRecording } from '$lib/recorder/toggleRecording';
	import { options } from '$lib/stores/options';
	import { registerShortcut, unregisterAllShortcuts } from '$lib/system-apis/shortcuts';
	import '@repo/ui/app.pcss';
	import { ModeWatcher, Toaster } from '@repo/ui/components/sonner';
	import { onDestroy, onMount } from 'svelte';

	onMount(async () => await registerShortcut($options.currentGlobalShortcut, toggleRecording));
	onDestroy(async () => await unregisterAllShortcuts());
</script>

<svelte:head>
	<title>Whispering</title>
</svelte:head>

<slot />
<Toaster />
<ModeWatcher />
