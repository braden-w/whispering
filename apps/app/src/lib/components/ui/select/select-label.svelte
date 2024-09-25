<script lang="ts">
import type { Select as SelectPrimitive } from 'bits-ui';

type $$Props = SelectPrimitive.LabelProps;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<SelectPrimitive.Label
	class={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
	{...$$restProps}
>
	<slot />
</SelectPrimitive.Label>
