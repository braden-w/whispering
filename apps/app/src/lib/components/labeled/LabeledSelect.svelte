<script lang="ts" generics="T extends string ">
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let {
		id,
		label,
		items = [],
		selected,
		onSelectedChange,
		placeholder = 'Select an option',
		disabled = false,
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
	} = $props();

	const selectedLabel = $derived(
		items.find((item) => item.value === selected)?.label,
	);
</script>

<Label class="text-sm" for={id}>{label}</Label>
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
