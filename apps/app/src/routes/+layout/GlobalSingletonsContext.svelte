<script lang="ts">
	import { initTranscriberInContext } from '$lib/query/transcriber/transcriber';
	import { initRecorderInContext } from '$lib/query/recorder/recorder';
	import { initRegisterShortcutsInContext } from '$lib/stores/settings.svelte';

	const transcriber = initTranscriberInContext();
	const recorder = initRecorderInContext({ transcriber });
	const registerShortcuts = initRegisterShortcutsInContext({ recorder });

	let { children } = $props();
</script>

{@render children()}
