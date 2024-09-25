<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

const {
	children,
	class: className,
	...restProps
}: HTMLAttributes<HTMLTableSectionElement> = $props();
</script>

<tfoot class={cn('bg-primary text-primary-foreground font-medium', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</tfoot>
