<script lang="ts">
	import { Button, type Props } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import type { Snippet } from 'svelte';

	let {
		children,
		tooltipContent,
		...restProps
	}: { tooltipContent: string | Snippet } & Props = $props();
</script>

{#snippet tooltip()}
	{#if typeof tooltipContent === 'string'}
		{tooltipContent}
	{:else}
		{@render tooltipContent()}
	{/if}
{/snippet}

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button {...restProps} {...props}>
					{@render children?.()}
					<span class="sr-only">
						{@render tooltip()}
					</span>
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>
			{@render tooltip()}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
