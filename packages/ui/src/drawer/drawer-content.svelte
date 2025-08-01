<script lang="ts">
	import { cn } from '#/utils/utils.js';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';

	import DrawerOverlay from './drawer-overlay.svelte';

	let {
		children,
		class: className,
		portalProps,
		ref = $bindable(null),
		...restProps
	}: DrawerPrimitive.ContentProps & {
		portalProps?: DrawerPrimitive.PortalProps;
	} = $props();
</script>

<DrawerPrimitive.Portal {...portalProps}>
	<DrawerOverlay />
	<DrawerPrimitive.Content
		bind:ref
		data-slot="drawer-content"
		class={cn(
			'group/drawer-content bg-background fixed z-50 flex h-auto flex-col',
			'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
			'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
			'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
			'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
			// Override to z-40 to ensure that alert-dialogs (which are at z-50) are always on top of drawers
			'z-40',
			className,
		)}
		{...restProps}
	>
		<div
			class="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block"
		></div>
		<!-- Scrollable content area: flex-1 takes remaining space after drag handle, overflow-y-auto enables 
		     vertical scrolling when content exceeds height, flex flex-col gap-4 p-4 restores original spacing -->
		<div class="flex-1 overflow-y-auto">
			{@render children?.()}
		</div>
	</DrawerPrimitive.Content>
</DrawerPrimitive.Portal>
