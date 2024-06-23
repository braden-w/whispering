<script lang="ts">
	import { Button, type Props } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type AnchorElement = HTMLAnchorAttributes & {
		href?: HTMLAnchorAttributes['href'];
		type?: never;
	} & Props;

	type ButtonElement = HTMLButtonAttributes & {
		type?: HTMLButtonAttributes['type'];
		href?: never;
	} & Props;

	type ButtonProps = AnchorElement | ButtonElement;

	let {
		children,
		tooltipText,
		...restProps
	}: {
		tooltipText: string;
	} & ButtonProps = $props();
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
