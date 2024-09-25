<script lang="ts">
import type { HTMLTableAttributes } from 'svelte/elements';

const {
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
