<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		checked = $bindable(),
		onCheckedChange,
	}: {
		id: string;
		label: string | Snippet;
		checked: boolean;
		onCheckedChange?: (value: boolean) => void;
	} = $props();
</script>

<div class="flex items-center gap-2">
	<Switch {id} aria-labelledby={id} bind:checked {onCheckedChange} />
	<Label for={id}>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</Label>
</div>
