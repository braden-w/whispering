<script lang="ts">
	import { Button, type Props } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mergeProps } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		id,
		trigger,
		tooltipContent,
		...restProps
	}: {
		id: string | null | undefined;
		trigger: Snippet<
			[{ tooltipProps: Record<string, unknown>; tooltip: Snippet<[]> }]
		>;
		tooltipContent: string | Snippet;
	} = $props();
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
		<Tooltip.Trigger id={id ?? undefined}>
			{#snippet child({ props: tooltipProps })}
				{@render trigger?.({
					tooltipProps: mergeProps(tooltipProps, restProps),
					tooltip,
				})}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content class="max-w-xs text-center">
			{@render tooltip()}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
