<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

type $$Props = HTMLAttributes<HTMLSpanElement>;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<span class={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...$$restProps}>
	<slot />
</span>
