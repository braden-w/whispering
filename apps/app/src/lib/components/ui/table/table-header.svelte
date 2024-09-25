<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

const {
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
