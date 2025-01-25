<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import {
		type CopyToClipboardLabel,
		useCopyTextToClipboardWithToast,
	} from '$lib/query/clipboard/mutations';
	import { CheckIcon } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { Props } from '$lib/components/ui/button';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	let {
		label,
		copyableText,
		viewTransitionName,
		copyIcon: providedCopyIcon,
		class: className,
	}: {
		label: CopyToClipboardLabel;
		copyableText: string;
		viewTransitionName?: string;
		copyIcon?: Snippet;
		class?: string;
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
		copyTextToClipboardWithToast.mutate(
			{ label, text: copyableText },
			{ onSuccess: () => (hasCopied = true) },
		)}
	style={viewTransitionName
		? `view-transition-name: ${viewTransitionName};`
		: undefined}
	class={className}
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
