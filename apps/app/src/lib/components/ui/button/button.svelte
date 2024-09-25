<script lang="ts">
import type { Events, Props } from './index.js';

type $$Props = Props;
type $$Events = Events;

const className: $$Props['class'] = undefined;
export const variant: $$Props['variant'] = 'default';
export const size: $$Props['size'] = 'default';
export const builders: $$Props['builders'] = [];
export { className as class };
</script>

<ButtonPrimitive.Root
	{builders}
	class={cn(buttonVariants({ variant, size, className }))}
	type="button"
	{...$$restProps}
	on:click
	on:keydown
>
	<slot />
</ButtonPrimitive.Root>
