<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: DrawerPrimitive.TitleProps = $props();
</script>

<DrawerPrimitive.Title
	bind:ref
	data-slot="drawer-title"
	class={cn('text-foreground font-semibold', className)}
	{...restProps}
/>
