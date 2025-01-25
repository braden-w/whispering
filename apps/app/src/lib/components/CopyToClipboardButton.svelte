<script lang="ts">
	import { type Props } from '$lib/components/ui/button/index.js';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import {
		type CopyToClipboardLabel,
		useCopyTextToClipboardWithToast,
	} from '$lib/query/clipboard/mutations';
	import { CheckIcon } from 'lucide-svelte';
	import { ClipboardIcon } from '$lib/components/icons';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	const {
		label,
		copyableText,
		viewTransitionName,
	}: {
		label: CopyToClipboardLabel;
		copyableText: string;
		viewTransitionName?: string;
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
	onclick={() =>
		copyTextToClipboardWithToast.mutate(
			{ label, text: copyableText },
			{ onSuccess: () => (hasCopied = true) },
		)}
	style={viewTransitionName
		? `view-transition-name: ${viewTransitionName};`
		: undefined}
>
	<span class="sr-only">Copy</span>
	{#if hasCopied}
		<CheckIcon />
	{:else}
		<ClipboardIcon />
	{/if}
</WhisperingButton>
