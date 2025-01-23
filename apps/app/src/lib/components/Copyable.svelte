<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const copyableVariants = tv({
		base: 'relative whitespace-normal rounded p-4 pr-12 text-sm',
		variants: {
			variant: {
				code: 'bg-muted text-muted-foreground font-semibold font-mono',
				prose: 'bg-muted text-muted-foreground',
				error: 'bg-destructive/10 text-destructive',
			},
		},
	});

	export type CopyableVariants = VariantProps<
		typeof copyableVariants
	>['variant'];
</script>

<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { useCopyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { CheckIcon, CopyIcon } from 'lucide-svelte';
	import { Label } from './ui/label';
	import { cn } from '$lib/utils';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	const {
		label,
		hideLabel,
		copyableText,
		variant,
	}: {
		label: string;
		hideLabel?: boolean;
		copyableText: string;
		variant: CopyableVariants;
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

<div class="flex flex-col gap-2">
	<Label class={cn('text-sm', hideLabel && 'sr-only')}>
		{label}
	</Label>
	<pre class={copyableVariants({ variant })}>
	<WhisperingButton
			tooltipContent="Copy to clipboard"
			size="icon"
			variant="ghost"
			class="absolute right-4 top-4 h-4 w-4"
			onclick={() =>
				copyTextToClipboardWithToast.mutate(
					{ label: 'code', text: copyableText },
					{ onSuccess: () => (hasCopied = true) },
				)}>
			<span class="sr-only">Copy</span>
    {#if hasCopied}
				<CheckIcon />
			{:else}
				<CopyIcon />
			{/if}
		</WhisperingButton>
{copyableText}
</pre>
</div>
