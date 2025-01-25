<script lang="ts">
	import { Button, type Props } from '$lib/components/ui/button/index.js';
	import { mergeProps } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import WhisperingTooltip from './WhisperingTooltip.svelte';

	let {
		id,
		children,
		tooltipContent,
		...restProps
	}: Props & { tooltipContent: string | Snippet } = $props();
</script>

<WhisperingTooltip {id} {tooltipContent}>
	{#snippet trigger({ tooltipProps, tooltip })}
		<Button {...mergeProps(tooltipProps, restProps)}>
			{@render children?.()}
			<span class="sr-only">
				{@render tooltip()}
			</span>
		</Button>
	{/snippet}
</WhisperingTooltip>
