<script lang="ts">
import type { Props } from '$lib/components/ui/button';

const {
	children,
	tooltipText,
	...restProps
}: {
	tooltipText: string;
} & Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger asChild let:builder>
		<Button builders={[builder]} {...restProps}>
			{#if children}
				{@render children()}
			{/if}
			<span class="sr-only">{tooltipText}</span>
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>{tooltipText}</p>
	</Tooltip.Content>
</Tooltip.Root>
