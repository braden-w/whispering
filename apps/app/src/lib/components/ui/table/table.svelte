<script lang="ts">
import { cn } from '$lib/utils.js';
import type { HTMLTableAttributes } from 'svelte/elements';

let {
	children,
	class: className,
	...restProps
}: HTMLTableAttributes = $props();
</script>

<div class="relative w-full overflow-auto">
	<table class={cn('w-full caption-bottom text-sm', className)} {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</table>
</div>
