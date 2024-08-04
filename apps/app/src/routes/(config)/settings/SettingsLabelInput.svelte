<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value,
		onchange,
		placeholder = '',
		type = 'text',
		disabled = false,
	}: HTMLInputAttributes & {
		label: string;
		value: string;
		placeholder?: string;
		type?: 'text' | 'password';
		disabled?: boolean;
	} = $props();
</script>

<Label class="text-sm" for={id}>{label}</Label>
<Input {id} {placeholder} {value} {onchange} {type} {disabled} autocomplete="off" />
