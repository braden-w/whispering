<script lang="ts">
import { flyAndScale } from '$lib/utils.js';
import type { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

type $$Props = DropdownMenuPrimitive.ContentProps;
type $$Events = DropdownMenuPrimitive.ContentEvents;

const className: $$Props['class'] = undefined;
export const sideOffset: $$Props['sideOffset'] = 4;
export const transition: $$Props['transition'] = flyAndScale;
export const transitionConfig: $$Props['transitionConfig'] = undefined;
export { className as class };
</script>

<DropdownMenuPrimitive.Content
	{transition}
	{transitionConfig}
	{sideOffset}
	class={cn(
		'bg-popover text-popover-foreground z-50 min-w-[8rem] rounded-md border p-1 shadow-md focus:outline-none',
		className,
	)}
	{...$$restProps}
	on:keydown
>
	<slot />
</DropdownMenuPrimitive.Content>
