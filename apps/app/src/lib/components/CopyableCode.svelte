<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { MainLive } from '$lib/services';
	import { ClipboardService } from '$lib/services/ClipboardService';
	import { toast } from '$lib/services/ToastService';
	import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
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
		onclick={() => {
			Effect.gen(function* () {
				const clipboardService = yield* ClipboardService;
				yield* clipboardService.setClipboardText(codeText);
				yield* toast({
					variant: 'success',
					title: 'Copied transcriptions to clipboard!',
					description: codeText,
					descriptionClass: 'line-clamp-2',
				});
				hasCopied = true;
			}).pipe(
				Effect.catchAll(renderErrorAsToast),
				Effect.provide(MainLive),
				Effect.runPromise,
			);
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
