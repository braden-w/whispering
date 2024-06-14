<script lang="ts">
	import { cn } from '@repo/ui/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		children,
		class: className,
		...restProps
	}: HTMLAttributes<HTMLTableSectionElement> = $props();
</script>

<tbody class={cn('[&_tr:last-child]:border-0', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</tbody>
