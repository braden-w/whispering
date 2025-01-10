<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { copyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { CheckIcon, CopyIcon } from 'lucide-svelte';

	const { codeText }: { codeText: string } = $props();
	let hasCopied = $state(false);

	$effect(() => {
		if (hasCopied) {
			setTimeout(() => {
				hasCopied = false;
			}, 2000);
		}
	});
</script>

<pre
	class="bg-muted relative whitespace-normal rounded p-4 pr-12 font-mono text-sm font-semibold">
  <WhisperingButton
		tooltipContent="Copy to clipboard"
		size="icon"
		variant="ghost"
		class="absolute right-4 top-4 h-4 w-4"
		onclick={() =>
			copyTextToClipboardWithToast.mutate({ label: 'code', text: codeText })}>
			<span class="sr-only">Copy</span>
    {#if hasCopied}
			<CheckIcon />
		{:else}
			<CopyIcon />
		{/if}
		</WhisperingButton>
{codeText}
</pre>
