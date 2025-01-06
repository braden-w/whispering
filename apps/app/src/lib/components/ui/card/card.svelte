<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils.js';
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		'bg-card text-card-foreground rounded-lg border shadow-sm',
		className,
	)}
	transition:slide
	{...restProps}
>
	{@render children?.()}
</div>
