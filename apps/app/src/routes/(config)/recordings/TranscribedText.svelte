<script lang="ts">
	import CopyToClipboardButton from '$lib/components/CopyToClipboardButton.svelte';
	import Copyable from '$lib/components/Copyable.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { useCopyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { CopyIcon } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	let {
		recordingId,
		transcribedText,
	}: { recordingId: string; transcribedText: string } = $props();

	let isPopoverOpen = $state(false);
</script>

<div class="flex items-center gap-2">
	<Popover.Root bind:open={isPopoverOpen}>
		<Popover.Trigger>
			{#snippet child({ props })}
				<WhisperingButton
					{...props}
					variant="outline"
					tooltipContent="View Transcribed Text"
					class="w-full block max-w-48 text-left text-sm leading-snug overflow-y-auto h-full max-h-12 text-wrap [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
					style="view-transition-name: {createRecordingViewTransitionName({
						recordingId: recordingId,
						propertyName: 'transcribedText',
					})}"
				>
					{transcribedText}
				</WhisperingButton>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="max-w-md w-full max-h-96 overflow-y-auto space-y-4">
			<Card.Title class="text-lg">Transcribed Text</Card.Title>
			<pre
				class="relative whitespace-normal rounded p-4 text-sm prose bg-muted text-muted-foreground">{transcribedText}</pre>
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
								text: transcribedText,
							},
							{ onSuccess: () => (isPopoverOpen = false) },
						);
					}}
				>
					<CopyIcon class="h-4 w-4" />
					Copy Text
				</Button>
			</Dialog.Footer>
		</Popover.Content>
	</Popover.Root>

	<CopyToClipboardButton
		label="transcribed text"
		copyableText={transcribedText}
		style="view-transition-name: {createRecordingViewTransitionName({
			recordingId: recordingId,
			propertyName: 'transcribedText',
		})}-copy-button"
	/>
</div>
