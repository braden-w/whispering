<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import type { HeadingLevel } from './index.js';

type $$Props = HTMLAttributes<HTMLHeadingElement> & {
	tag?: HeadingLevel;
};

const className: $$Props['class'] = undefined;
export const tag: $$Props['tag'] = 'h3';
export { className as class };
</script>

<svelte:element
	this={tag}
	class={cn('text-lg font-semibold leading-none tracking-tight', className)}
	{...$$restProps}
>
	<slot />
</svelte:element>
