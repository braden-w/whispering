<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const copyableCodeVariants = tv({
		base: 'relative whitespace-normal rounded p-4 pr-12 font-mono text-sm font-semibold',
		variants: {
			variant: {
				default: 'bg-muted text-muted-foreground',
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
	import { CheckIcon, CopyIcon } from 'lucide-svelte';
	import { Label } from './ui/label';
	import { cn } from '$lib/utils';

	const {
		label,
		hideLabel,
		codeText,
		variant,
	}: {
		label: string;
		hideLabel?: boolean;
		codeText: string;
		variant?: CopyableCodeVariant;
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
</div>
