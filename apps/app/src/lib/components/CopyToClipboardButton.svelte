<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import {
		type CopyToClipboardLabel,
		useCopyTextToClipboardWithToast,
	} from '$lib/query/clipboard/mutations';
	import { cn } from '$lib/utils';
	import { CheckIcon, CopyIcon } from 'lucide-svelte';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	const {
		class: className,
		label,
		copyableText,
	}: {
		class?: string;
		label: CopyToClipboardLabel;
		copyableText: string;
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
	tooltipContent="Copy to clipboard"
	size="icon"
	variant="ghost"
	class={cn('h-4 w-4', className)}
	onclick={() =>
		copyTextToClipboardWithToast.mutate(
			{ label, text: copyableText },
			{ onSuccess: () => (hasCopied = true) },
		)}
>
	<span class="sr-only">Copy</span>
	{#if hasCopied}
		<CheckIcon />
	{:else}
		<CopyIcon />
	{/if}
</WhisperingButton>
