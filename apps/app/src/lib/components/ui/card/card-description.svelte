<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

type $$Props = HTMLAttributes<HTMLParagraphElement>;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<p class={cn('text-muted-foreground text-sm', className)} {...$$restProps}>
	<slot />
</p>
