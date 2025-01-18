<script lang="ts">
	import { Button, type Props } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mergeProps } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		id,
		children,
		tooltipContent,
		...restProps
	}: { id?: string; tooltipContent: string | Snippet } & Props = $props();
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
		<Tooltip.Trigger {id}>
			{#snippet child({ props: tooltipProps })}
				<Button {...mergeProps(tooltipProps, restProps)}>
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
