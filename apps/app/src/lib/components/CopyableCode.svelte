<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardService } from '$lib/services/ClipboardService';
	import { toast } from '$lib/services/ToastService';
	import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
	import { Effect } from 'effect';
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
		tooltipText="Copy to clipboard"
		size="icon"
		variant="ghost"
		class="absolute right-4 top-4 h-4 w-4"
		onclick={async () => {
			const clipboardService = ClipboardService;
			const setClipboardTextResult =
				await clipboardService.setClipboardText(codeText);
			if (!setClipboardTextResult.ok)
				return renderErrAsToast(setClipboardTextResult);
			toast({
				variant: 'success',
				title: 'Copied transcriptions to clipboard!',
				description: codeText,
				descriptionClass: 'line-clamp-2',
			});
			hasCopied = true;
		}}>
			<span class="sr-only">Copy</span>
    {#if hasCopied}
			<CheckIcon />
		{:else}
			<CopyIcon />
		{/if}
		</WhisperingButton>
{codeText}
</pre>
