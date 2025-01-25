<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';
	import { useCopyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { ClipboardIcon } from '$lib/components/icons';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	let {
		text,
		buttonViewTransitionName,
	}: {
		text: string;
		buttonViewTransitionName: string;
	} = $props();

	let isPopoverOpen = $state(false);
</script>

{#if text}
	<Popover.Root bind:open={isPopoverOpen}>
		<Popover.Trigger>
			{#snippet child({ props })}
				<WhisperingButton
					{...props}
					variant="outline"
					tooltipContent="View Transcribed Text"
					class="w-full block text-left text-sm leading-snug overflow-y-auto h-full max-h-12 text-wrap [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
					style="view-transition-name: {buttonViewTransitionName}"
				>
					{text}
				</WhisperingButton>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="max-w-md w-full space-y-4">
			<Card.Title class="text-lg">Transcribed Text</Card.Title>
			<pre
				class="relative whitespace-normal rounded p-4 text-sm prose bg-muted text-muted-foreground max-h-96 overflow-y-auto">{text}</pre>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (isPopoverOpen = false)}>
					Close
				</Button>
				<Button
					variant="outline"
					onclick={() => {
						copyTextToClipboardWithToast.mutate(
							{
								label: 'transcribed text',
								text: text,
							},
							{ onSuccess: () => (isPopoverOpen = false) },
						);
					}}
				>
					<ClipboardIcon class="h-4 w-4" />
					Copy Text
				</Button>
			</Dialog.Footer>
		</Popover.Content>
	</Popover.Root>
{/if}
