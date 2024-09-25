<script lang="ts">
import { flyAndScale } from '$lib/utils.js';
import type { Tooltip as TooltipPrimitive } from 'bits-ui';

type $$Props = TooltipPrimitive.ContentProps;

const className: $$Props['class'] = undefined;
export const sideOffset: $$Props['sideOffset'] = 4;
export const transition: $$Props['transition'] = flyAndScale;
export const transitionConfig: $$Props['transitionConfig'] = {
	y: 8,
	duration: 150,
};
export { className as class };
</script>

<TooltipPrimitive.Content
	{transition}
	{transitionConfig}
	{sideOffset}
	class={cn(
		'bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md',
		className,
	)}
	{...$$restProps}
>
	<slot />
</TooltipPrimitive.Content>
