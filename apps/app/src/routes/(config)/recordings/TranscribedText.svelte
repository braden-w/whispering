<script lang="ts">
	import CopyToClipboardButton from '$lib/components/CopyToClipboardButton.svelte';
	import Copyable from '$lib/components/Copyable.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { useCopyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { CopyIcon, Loader2Icon } from 'lucide-svelte';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	let {
		recordingId,
		transcribedText,
	}: { recordingId: string; transcribedText: string } = $props();

	let isDialogOpen = $state(false);
</script>

<div class="flex items-center gap-2">
	<Dialog.Root bind:open={isDialogOpen}>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<WhisperingButton
					{...props}
					variant="outline"
					tooltipContent="View Transcribed Text"
					class="w-full block max-w-md text-left text-sm leading-snug overflow-y-auto h-full max-h-16 text-wrap [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
					style="view-transition-name: {createRecordingViewTransitionName({
						recordingId: recordingId,
						propertyName: 'transcribedText',
					})}"
				>
					{transcribedText}
				</WhisperingButton>
			{/snippet}
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-3xl">
			<Dialog.Header>
				<Dialog.Title>Transcribed Text</Dialog.Title>
			</Dialog.Header>
			<Copyable
				variant="text"
				copyableText={transcribedText}
				label="Transcribed Text"
				hideLabel
			/>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (isDialogOpen = false)}>
					Close
				</Button>
				<Button
					variant="outline"
					onclick={() =>
						copyTextToClipboardWithToast.mutate(
							{
								label: 'transcribed text',
								text: transcribedText,
							},
							{
								onSuccess: () => {
									isDialogOpen = false;
								},
							},
						)}
					disabled={copyTextToClipboardWithToast.isPending}
				>
					{#if copyTextToClipboardWithToast.isPending}
						<Loader2Icon class="h-4 w-4 animate-spin" />
					{:else}
						<CopyIcon class="h-4 w-4" />
					{/if}
					Copy Text
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<CopyToClipboardButton
		label="transcribed text"
		copyableText={transcribedText}
		style="view-transition-name: {createRecordingViewTransitionName({
			recordingId: recordingId,
			propertyName: 'transcribedText',
		})}-copy-button"
	/>
</div>
