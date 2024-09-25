<script lang="ts">
import type { Label as LabelPrimitive } from 'bits-ui';

type $$Props = LabelPrimitive.Props;
type $$Events = LabelPrimitive.Events;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<LabelPrimitive.Root
	class={cn(
		'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
		className,
	)}
	{...$$restProps}
	on:mousedown
>
	<slot />
</LabelPrimitive.Root>
