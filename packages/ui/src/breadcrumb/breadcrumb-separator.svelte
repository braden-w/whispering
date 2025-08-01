<script lang="ts">
	import type { HTMLLiAttributes } from 'svelte/elements';

	import { cn, type WithElementRef } from '#/utils/utils.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
	bind:this={ref}
	data-slot="breadcrumb-separator"
	role="presentation"
	aria-hidden="true"
	class={cn('[&>svg]:size-3.5', className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<ChevronRightIcon />
	{/if}
</li>
