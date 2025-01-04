<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		value = $bindable(),
		type = 'text',
		placeholder = '',
		disabled = false,
		description,
		...restProps
	}: HTMLInputAttributes & {
		label: string;
		value: string;
		type?: 'text' | 'password' | 'number';
		placeholder?: string;
		disabled?: boolean;
		description?: string | Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<Label class="text-sm" for={id}>{label}</Label>
	<Input
		{id}
		bind:value
		{placeholder}
		{type}
		{disabled}
		autocomplete="off"
		{...restProps}
	/>
	{#if description}
		<div class="text-muted-foreground text-sm">
			{#if typeof description === 'string'}
				{description}
			{:else}
				{@render description()}
			{/if}
		</div>
	{/if}
</div>
