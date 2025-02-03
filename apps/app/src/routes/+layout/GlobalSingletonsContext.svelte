<script lang="ts">
	import { initTranscriberInContext } from '$lib/query/singletons/transcriber';
	import { initRecorderInContext } from '$lib/query/singletons/recorder';
	import { initTransformerInContext } from '$lib/query/singletons/transformer';
	import { initRegisterShortcutsInContext } from '$lib/stores/settings.svelte';

	const transcriber = initTranscriberInContext();
	const transformer = initTransformerInContext();
	const recorder = initRecorderInContext({ transcriber, transformer });
	const registerShortcuts = initRegisterShortcutsInContext({ recorder });

	let { children } = $props();
</script>

{@render children()}
