<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(),
		onValueChange,
		placeholder = '',
		type = 'text',
		disabled = false,
	}: HTMLInputAttributes & {
		label: string;
		value: string;
		onValueChange?: (value: string) => void;
		placeholder?: string;
		type?: 'text' | 'password';
		disabled?: boolean;
	} = $props();

	$effect(() => {
		// TODO: Move this logic to {onchange} event once it's supported
		if (onValueChange) onValueChange(value);
	});
</script>

<Label class="text-sm" for={id}>{label}</Label>
<Input {id} {placeholder} bind:value {type} {disabled} autocomplete="off" />
