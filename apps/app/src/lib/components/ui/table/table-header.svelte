<script lang="ts">
import { cn } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';

let {
	children,
	class: className,
	...restProps
}: HTMLAttributes<HTMLTableSectionElement> = $props();
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<thead class={cn('[&_tr]:border-b', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</thead>
