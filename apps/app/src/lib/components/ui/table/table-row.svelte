<script lang="ts">
import { cn } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';

let {
	children,
	class: className,
	...restProps
}: HTMLAttributes<HTMLTableRowElement> & {
	'data-state'?: unknown;
} = $props();
</script>

<tr
	class={cn(
		'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
		className,
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</tr>
