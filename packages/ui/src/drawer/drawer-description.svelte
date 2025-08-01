<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: DrawerPrimitive.DescriptionProps = $props();
</script>

<DrawerPrimitive.Description
	bind:ref
	data-slot="drawer-description"
	class={cn('text-muted-foreground text-sm', className)}
	{...restProps}
/>
