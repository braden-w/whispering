<script lang="ts">
	import { Label } from '@repo/ui/label';
	import { Switch } from '@repo/ui/switch';
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		checked = $bindable(),
		onCheckedChange,
		description,
		disabled = $bindable(),
	}: {
		id: string;
		label: string | Snippet;
		checked: boolean;
		onCheckedChange?: (value: boolean) => void;
		description?: string;
		disabled?: boolean;
	} = $props();
</script>

<div class="flex items-center gap-2">
	<Switch {id} aria-labelledby={id} bind:checked {onCheckedChange} {disabled} />
	<Label for={id}>
		{#if typeof label === 'string'}
			{label}
		{:else}
			{@render label()}
		{/if}
	</Label>
</div>

{#if description}
	<p class="text-sm text-muted-foreground">{description}</p>
{/if}
