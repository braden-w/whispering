<script lang="ts">
import type { Toggle as TogglePrimitive } from 'bits-ui';
import type { Size, Variant } from './index.js';

type $$Props = TogglePrimitive.Props & {
	variant?: Variant;
	size?: Size;
};
type $$Events = TogglePrimitive.Events;

const className: $$Props['class'] = undefined;
export const variant: $$Props['variant'] = 'default';
export const size: $$Props['size'] = 'default';
export const pressed: $$Props['pressed'] = undefined;
export { className as class };
</script>

<TogglePrimitive.Root
	bind:pressed
	class={cn(toggleVariants({ variant, size, className }))}
	{...$$restProps}
	on:click
>
	<slot />
</TogglePrimitive.Root>
