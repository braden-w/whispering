<script lang="ts">
import { flyAndScale } from '$lib/utils.js';
import type { Select as SelectPrimitive } from 'bits-ui';
import { scale } from 'svelte/transition';

type $$Props = SelectPrimitive.ContentProps;
type $$Events = SelectPrimitive.ContentEvents;

export const sideOffset: $$Props['sideOffset'] = 4;
export const inTransition: $$Props['inTransition'] = flyAndScale;
export const inTransitionConfig: $$Props['inTransitionConfig'] = undefined;
export const outTransition: $$Props['outTransition'] = scale;
export const outTransitionConfig: $$Props['outTransitionConfig'] = {
	start: 0.95,
	opacity: 0,
	duration: 50,
};

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<SelectPrimitive.Content
	{inTransition}
	{inTransitionConfig}
	{outTransition}
	{outTransitionConfig}
	{sideOffset}
	class={cn(
		'bg-popover text-popover-foreground relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md outline-none',
		className,
	)}
	{...$$restProps}
	on:keydown
>
	<div class="w-full p-1">
		<slot />
	</div>
</SelectPrimitive.Content>
