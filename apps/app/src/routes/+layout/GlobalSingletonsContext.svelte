<script lang="ts">
	import { initRecorderInContext } from '$lib/query/singletons/recorder';
	import { initTranscriberInContext } from '$lib/query/singletons/transcriber';
	import { initTransformerInContext } from '$lib/query/singletons/transformer';
	import { initVadRecorderInContext } from '$lib/query/singletons/vadRecorder';
	import { initRegisterShortcutsInContext } from '$lib/stores/settings.svelte';

	const transcriber = initTranscriberInContext();
	const transformer = initTransformerInContext();
	const recorder = initRecorderInContext({ transcriber, transformer });
	const vadRecorder = initVadRecorderInContext({ transcriber, transformer });
	const registerShortcuts = initRegisterShortcutsInContext({ recorder });

	let { children } = $props();
</script>

{@render children()}
