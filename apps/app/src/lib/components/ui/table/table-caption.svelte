<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

const {
	children,
	class: className,
	...restProps
}: HTMLAttributes<HTMLTableCaptionElement> = $props();
</script>

<caption class={cn('text-muted-foreground mt-4 text-sm', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</caption>
