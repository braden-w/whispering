<script lang="ts">
	import { Button, type Props } from '$lib/components/ui/button/index.js';
	import { mergeProps } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import WhisperingTooltip from './WhisperingTooltip.svelte';
	import { nanoid } from 'nanoid/non-secure';

	let {
		id = nanoid(),
		children,
		tooltipContent,
		...buttonProps
	}: Props & { id?: string; tooltipContent: string | Snippet } = $props();
</script>

<WhisperingTooltip {id} {tooltipContent}>
	{#snippet trigger({ tooltipProps, tooltip })}
		<Button {...mergeProps(tooltipProps, buttonProps)}>
			{@render children?.()}
			<span class="sr-only">
				{@render tooltip()}
			</span>
		</Button>
	{/snippet}
</WhisperingTooltip>
