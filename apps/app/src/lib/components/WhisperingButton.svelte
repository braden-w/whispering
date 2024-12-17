<script lang="ts">
	import { Button, type Props } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	let {
		children,
		tooltipText,
		...restProps
	}: {
		tooltipText: string;
	} & Props = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child()}
				<Button {...restProps}>
					{@render children?.()}
					<span class="sr-only">{tooltipText}</span>
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>{tooltipText}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
