<script lang="ts">
import type { Dialog as DialogPrimitive } from 'bits-ui';

type $$Props = DialogPrimitive.TitleProps;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<DialogPrimitive.Title
	class={cn('text-lg font-semibold leading-none tracking-tight', className)}
	{...$$restProps}
>
	<slot />
</DialogPrimitive.Title>
