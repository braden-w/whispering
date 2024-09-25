<script lang="ts">
import type { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

type $$Props = DropdownMenuPrimitive.SeparatorProps;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<DropdownMenuPrimitive.Separator
	class={cn('bg-muted -mx-1 my-1 h-px', className)}
	{...$$restProps}
/>
