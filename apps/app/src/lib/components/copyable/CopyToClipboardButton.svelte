<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import {
		copyTextToClipboardWithToast,
		type CopyToClipboardLabel,
	} from '$lib/query/clipboard/mutations';
	import { CheckIcon } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import type { Props } from '$lib/components/ui/button';

	let {
		label,
		copyableText,
		viewTransitionName,
		copyIcon: providedCopyIcon,
		class: className,
		size = 'icon',
		variant = 'ghost',
		disabled,
	}: {
		label: CopyToClipboardLabel;
		copyableText: string;
		viewTransitionName?: string;
		copyIcon?: Snippet;
		class?: string;
	} & Pick<Props, 'disabled' | 'variant' | 'size'> = $props();

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
	onclick={() =>
		copyTextToClipboardWithToast(
			{ label, text: copyableText },
			{ onSuccess: () => (hasCopied = true) },
		)}
	style={viewTransitionName
		? `view-transition-name: ${viewTransitionName};`
		: undefined}
	class={className}
	{size}
	{variant}
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
