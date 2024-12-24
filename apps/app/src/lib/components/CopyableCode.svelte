<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardService } from '$lib/services/ClipboardService';
	import { toast } from '$lib/services/ToastService';
	import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
	import { createMutation } from '@epicenterhq/result';
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

	const { mutate: setClipboardText } = createMutation({
		mutationFn: (text: string) => ClipboardService.setClipboardText(text),
		onError: (error) => {
			if (error._tag === 'ClipboardError') {
				renderErrAsToast({
					_tag: 'WhisperingError',
					title: 'Error copying transcription to clipboard',
					description: 'Please try again.',
					action: { type: 'more-details', error: error },
				});
				return;
			}
			renderErrAsToast(error);
		},
		onSuccess: (_, { input: text }) => {
			toast.success({
				title: 'Copied transcription to clipboard!',
				description: text,
				descriptionClass: 'line-clamp-2',
			});
			hasCopied = true;
		},
	});
</script>

<pre
	class="bg-muted relative whitespace-normal rounded p-4 pr-12 font-mono text-sm font-semibold">
  <WhisperingButton
		tooltipContent="Copy to clipboard"
		size="icon"
		variant="ghost"
		class="absolute right-4 top-4 h-4 w-4"
		onclick={() => setClipboardText(codeText)}>
			<span class="sr-only">Copy</span>
    {#if hasCopied}
			<CheckIcon />
		{:else}
			<CopyIcon />
		{/if}
		</WhisperingButton>
{codeText}
</pre>
