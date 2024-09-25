<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

type $$Props = HTMLAttributes<HTMLDivElement>;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<div class={cn('flex items-center p-6 pt-0', className)} {...$$restProps}>
	<slot />
</div>
