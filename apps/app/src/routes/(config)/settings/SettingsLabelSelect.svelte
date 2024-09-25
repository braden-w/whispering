<script lang="ts" generics="T">
import type { SelectProps } from 'bits-ui';

const {
	id,
	label,
	items = [],
	selected,
	onSelectedChange,
	placeholder = 'Select an option',
	disabled = false,
}: SelectProps<T> & {
	id: string;
	label: string;
	placeholder?: string;
} = $props();
</script>

<Label class="text-sm" for={id}>{label}</Label>
<Select.Root {items} {selected} {onSelectedChange} {disabled}>
	<Select.Trigger class="w-full">
		<Select.Value {placeholder} />
	</Select.Trigger>
	<Select.Content class="max-h-96 overflow-auto">
		{#each items as item}
			<Select.Item value={item.value} label={item.label}>
				{item.label}
			</Select.Item>
		{/each}
	</Select.Content>
	<Select.Input {id} />
</Select.Root>
