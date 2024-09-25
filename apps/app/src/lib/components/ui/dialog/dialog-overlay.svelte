<script lang="ts">
import type { Dialog as DialogPrimitive } from 'bits-ui';
import { fade } from 'svelte/transition';

type $$Props = DialogPrimitive.OverlayProps;

const className: $$Props['class'] = undefined;
export const transition: $$Props['transition'] = fade;
export const transitionConfig: $$Props['transitionConfig'] = {
	duration: 150,
};
export { className as class };
</script>

<DialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	class={cn('bg-background/80 fixed inset-0 z-50 backdrop-blur-sm', className)}
	{...$$restProps}
/>
