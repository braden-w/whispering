<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { cn } from '#/utils/utils';

	import type { ChatBubbleMessageProps } from './types';

	import LoadingDots from './loading-dots.svelte';

	let {
		children,
		class: className,
		ref = $bindable(null),
		typing = false,
		...rest
	}: ChatBubbleMessageProps = $props();
</script>

<div
	{...rest}
	bind:this={ref}
	class={cn(
		"bg-secondary group-data-[variant='sent']/chat-bubble:bg-primary group-data-[variant='sent']/chat-bubble:text-primary-foreground order-2 rounded-lg p-4 text-sm group-data-[variant='received']/chat-bubble:rounded-bl-none group-data-[variant='sent']/chat-bubble:order-1 group-data-[variant='sent']/chat-bubble:rounded-br-none",
		className,
	)}
>
	{#if typing}
		<div class="flex size-full place-items-center justify-center">
			<LoadingDots />
		</div>
	{:else}
		{@render children?.()}
	{/if}
</div>
