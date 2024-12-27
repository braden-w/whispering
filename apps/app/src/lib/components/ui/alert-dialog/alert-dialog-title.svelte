<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		...restProps
	}: AlertDialogPrimitive.TitleProps = $props();
</script>

<AlertDialogPrimitive.Title
	bind:ref
	class={cn('text-lg font-semibold', className)}
	{level}
	{...restProps}
/>
