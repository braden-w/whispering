<script lang="ts">
import type { HTMLThAttributes } from 'svelte/elements';

const { children, class: className, ...restProps }: HTMLThAttributes = $props();
</script>

<th
	class={cn(
		'text-muted-foreground h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0',
		className,
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</th>
