<script lang="ts">
	import { cn } from '@repo/ui/utils';
	import type { HTMLTdAttributes } from 'svelte/elements';

	let { children, class: className, ...restProps }: HTMLTdAttributes = $props();
</script>

<td
	class={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</td>
