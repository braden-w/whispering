<script lang="ts">
	import { Input } from '@repo/ui/input';
	import { Label } from '@repo/ui/label';
	import { cn } from '@repo/ui/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(),
		type = 'text',
		placeholder = '',
		disabled = false,
		hideLabel = false,
		description,
		...restProps
	}: HTMLInputAttributes & {
		label: string;
		value: string;
		type?: 'text' | 'password' | 'number';
		placeholder?: string;
		disabled?: boolean;
		hideLabel?: boolean;
		description?: string | Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<Label class={cn('text-sm', hideLabel && 'sr-only')} for={id}>
		{label}
	</Label>
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
		{#if typeof description === 'string'}
			<p class="text-muted-foreground text-sm">{description}</p>
		{:else}
			{@render description()}
		{/if}
	{/if}
</div>
