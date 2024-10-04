<script lang="ts">
import { cn } from '$lib/utils.js';
import type { HTMLThAttributes } from 'svelte/elements';

let { children, class: className, ...restProps }: HTMLThAttributes = $props();
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
