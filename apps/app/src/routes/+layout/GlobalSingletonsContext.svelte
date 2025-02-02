<script lang="ts">
	import { initTranscriberInContext } from '$lib/query/transcriber/transcriber';
	import { initRecorderInContext } from '$lib/query/recorder/recorder';
	import { initTransformerInContext } from '$lib/query/transformer/transformer';
	import { initRegisterShortcutsInContext } from '$lib/stores/settings.svelte';

	const transcriber = initTranscriberInContext();
	const transformer = initTransformerInContext();
	const recorder = initRecorderInContext({ transcriber, transformer });
	const registerShortcuts = initRegisterShortcutsInContext({ recorder });

	let { children } = $props();
</script>

{@render children()}
