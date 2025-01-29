<script lang="ts">
	import { initRecorderInContext } from '$lib/query/recorder/mutations';
	import { initRegisterShortcutsInContext } from '$lib/stores/settings.svelte';

	const recorder = initRecorderInContext();
	const registerShortcuts = initRegisterShortcutsInContext({ recorder });

	let { children } = $props();
</script>

{@render children()}
