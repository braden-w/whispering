<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const copyableCodeVariants = tv({
		base: 'relative whitespace-normal rounded p-4 pr-12 font-mono text-sm font-semibold',
		variants: {
			variant: {
				default: 'bg-muted',
				error: 'bg-destructive/10 text-destructive',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	});

	export type CopyableCodeVariant = VariantProps<
		typeof copyableCodeVariants
	>['variant'];
</script>

<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { copyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { cn } from '$lib/utils';
	import { CheckIcon, CopyIcon } from 'lucide-svelte';

	const {
		codeText,
		variant,
	}: { codeText: string; variant?: CopyableCodeVariant } = $props();
	let hasCopied = $state(false);

	$effect(() => {
		if (hasCopied) {
			setTimeout(() => {
				hasCopied = false;
			}, 2000);
		}
	});
</script>

<pre class={copyableCodeVariants({ variant })}>
	<WhisperingButton
		tooltipContent="Copy to clipboard"
		size="icon"
		variant="ghost"
		class="absolute right-4 top-4 h-4 w-4"
		onclick={() =>
			copyTextToClipboardWithToast.mutate(
				{ label: 'code', text: codeText },
				{ onSuccess: () => (hasCopied = true) },
			)}>
			<span class="sr-only">Copy</span>
    {#if hasCopied}
			<CheckIcon />
		{:else}
			<CopyIcon />
		{/if}
		</WhisperingButton>
{codeText}
</pre>
