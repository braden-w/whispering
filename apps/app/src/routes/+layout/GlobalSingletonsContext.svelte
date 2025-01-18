<script lang="ts">
	import { initRecorderInContext } from '$lib/stores/recorder.svelte';
	import { initRegisterShortcutsInContext } from '$lib/stores/settings.svelte';
	import { initTranscriberInContext } from '$lib/stores/transcriber.svelte';

	const transcriber = initTranscriberInContext();
	const recorder = initRecorderInContext({ transcriber });
	const registerShortcuts = initRegisterShortcutsInContext({ recorder });

	let { children } = $props();
</script>

{@render children()}
