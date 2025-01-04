<script lang="ts" generics="T extends string ">
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		items = [],
		selected,
		onSelectedChange,
		placeholder = 'Select an option',
		disabled = false,
		description,
	}: {
		id: string;
		label: string;
		items: {
			value: T;
			label: string;
			disabled?: boolean;
		}[];
		selected: T;
		onSelectedChange: (selected: T) => void;
		placeholder?: string;
		disabled?: boolean;
		description?: string | Snippet;
	} = $props();

	const selectedLabel = $derived(
		items.find((item) => item.value === selected)?.label,
	);
</script>

<div class="flex flex-col gap-2">
	<Label class="text-sm" for={id}>
		{label}
	</Label>
	<Select.Root
		type="single"
		{items}
		value={selected}
		onValueChange={(selected) => {
			const selectedValue = selected as T | '';
			if (!selectedValue) return;
			onSelectedChange(selectedValue);
		}}
		{disabled}
	>
		<Select.Trigger class="w-full">
			{selectedLabel ?? placeholder}
		</Select.Trigger>
		<Select.Content class="max-h-96 overflow-auto">
			{#each items as item}
				<Select.Item value={item.value} label={item.label}>
					{item.label}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
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
