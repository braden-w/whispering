<script lang="ts">
	import { cn } from '../../../utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
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
