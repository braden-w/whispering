<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AccordionPrimitive.ItemProps = $props();
</script>

<AccordionPrimitive.Item
	bind:ref
	class={cn('border-b', className)}
	{...restProps}
/>
