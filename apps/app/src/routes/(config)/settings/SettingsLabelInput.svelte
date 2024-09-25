<script lang="ts">
import type { HTMLInputAttributes } from 'svelte/elements';

const {
	id,
	label,
	value,
	type = 'text',
	placeholder = '',
	disabled = false,
	...restProps
}: HTMLInputAttributes & {
	label: string;
	value: string;
	type?: 'text' | 'password';
	placeholder?: string;
	disabled?: boolean;
} = $props();
</script>

<Label class="text-sm" for={id}>{label}</Label>
<Input {id} bind:value {placeholder} {type} {disabled} autocomplete="off" {...restProps} />
