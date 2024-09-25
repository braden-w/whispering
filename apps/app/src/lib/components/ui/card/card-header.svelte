<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

type $$Props = HTMLAttributes<HTMLDivElement>;

const className: $$Props['class'] = undefined;
export { className as class };
</script>

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...$$restProps}>
	<slot />
</div>
