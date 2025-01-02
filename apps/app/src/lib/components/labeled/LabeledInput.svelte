<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(),
		type = 'text',
		placeholder = '',
		disabled = false,
		...restProps
	}: HTMLInputAttributes & {
		label: string;
		value: string;
		type?: 'text' | 'password' | 'number';
		placeholder?: string;
		disabled?: boolean;
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
</div>
