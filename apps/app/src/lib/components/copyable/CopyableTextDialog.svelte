<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { useCopyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { Textarea } from '$lib/components/ui/textarea';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	let {
		text,
		buttonViewTransitionName,
	}: {
		text: string;
		buttonViewTransitionName: string;
	} = $props();

	let isDialogOpen = $state(false);
</script>

{#if text}
	<Dialog.Root bind:open={isDialogOpen}>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<WhisperingButton
					{...props}
					variant="ghost"
					tooltipContent="View Transcribed Text"
					class="w-full h-full px-0 py-0"
					style="view-transition-name: {buttonViewTransitionName}"
				>
					<Textarea
						class="h-full max-h-12 text-left text-wrap text-sm leading-snug overflow-y-auto"
						readonly
						value={text}
						style="view-transition-name: {buttonViewTransitionName}"
					/>
				</WhisperingButton>
			{/snippet}
		</Dialog.Trigger>
		<Dialog.Content>
			<Card.Title class="text-lg">Transcribed Text</Card.Title>
			<pre
				class="relative whitespace-normal rounded p-4 text-sm prose bg-muted text-muted-foreground max-h-96 overflow-y-auto">{text}</pre>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (isDialogOpen = false)}>
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
							{ onSuccess: () => (isDialogOpen = false) },
						);
					}}
				>
					<ClipboardIcon class="h-4 w-4" />
					Copy Text
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
