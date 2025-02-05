<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import {
		copyTextToClipboardWithToast,
		type CopyToClipboardLabel,
	} from '$lib/query/clipboard/mutations';
	import { CheckIcon } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let {
		label,
		copyableText,
		viewTransitionName,
		copyIcon: providedCopyIcon,
		class: className,
		disabled,
	}: {
		label: CopyToClipboardLabel;
		copyableText: string;
		viewTransitionName?: string;
		copyIcon?: Snippet;
		class?: string;
		disabled?: boolean;
	} = $props();

	let hasCopied = $state(false);

	$effect(() => {
		if (hasCopied) {
			setTimeout(() => {
				hasCopied = false;
			}, 2000);
		}
	});
</script>

<WhisperingButton
	tooltipContent="Copy {label} to clipboard"
	size="icon"
	variant="ghost"
	onclick={() =>
		copyTextToClipboardWithToast(
			{ label, text: copyableText },
			{ onSuccess: () => (hasCopied = true) },
		)}
	style={viewTransitionName
		? `view-transition-name: ${viewTransitionName};`
		: undefined}
	class={className}
	{disabled}
>
	<span class="sr-only">Copy</span>
	{#if hasCopied}
		<CheckIcon />
	{:else}
		{@render copyIcon()}
	{/if}
</WhisperingButton>

{#snippet copyIcon()}
	{#if providedCopyIcon}
		{@render providedCopyIcon()}
	{:else}
		<ClipboardIcon />
	{/if}
{/snippet}
