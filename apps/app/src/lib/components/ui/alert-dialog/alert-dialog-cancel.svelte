<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AlertDialogPrimitive.CancelProps = $props();
</script>

<AlertDialogPrimitive.Cancel
	bind:ref
	class={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)}
	{...restProps}
/>
