<script lang="ts">
import type { Separator as SeparatorPrimitive } from 'bits-ui';

type $$Props = SeparatorPrimitive.Props;

const className: $$Props['class'] = undefined;
export const orientation: $$Props['orientation'] = 'horizontal';
export const decorative: $$Props['decorative'] = undefined;
export { className as class };
</script>

<SeparatorPrimitive.Root
	class={cn(
		'bg-border shrink-0',
		orientation === 'horizontal' ? 'h-[1px] w-full' : 'min-h-full w-[1px]',
		className,
	)}
	{orientation}
	{decorative}
	{...$$restProps}
/>
