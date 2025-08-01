<script lang="ts">
	import type { WithElementRef } from '#/utils/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<nav
	bind:this={ref}
	data-slot="breadcrumb"
	class={className}
	aria-label="breadcrumb"
	{...restProps}
>
	{@render children?.()}
</nav>
