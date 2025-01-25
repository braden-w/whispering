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
		...restProps
	}: Props & {
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
	{...restProps}
	tooltipContent="Copy to clipboard"
	size="icon"
	variant="ghost"
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
		<ClipboardIcon />
	{/if}
</WhisperingButton>
