<script lang="ts">
	import { ClipboardIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { useCopyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { mergeProps } from 'bits-ui';
	import WhisperingTooltip from '../WhisperingTooltip.svelte';

	const copyTextToClipboardWithToast = useCopyTextToClipboardWithToast();

	let {
		id,
		text,
		buttonViewTransitionName,
	}: {
		id: string;
		text: string;
		buttonViewTransitionName: string;
	} = $props();

	let isDialogOpen = $state(false);
</script>

{#if text}
	<Dialog.Root bind:open={isDialogOpen}>
		<Dialog.Trigger {id}>
			{#snippet child({ props: dialogTriggerProps })}
				<WhisperingTooltip {id} tooltipContent="View Transcribed Text">
					{#snippet trigger({ tooltipProps, tooltip })}
						<Textarea
							{...mergeProps(tooltipProps, dialogTriggerProps)}
							class="h-full resize-none overflow-y-auto text-wrap text-left text-sm leading-snug hover:bg-accent hover:text-accent-foreground"
							readonly
							value={text}
							style="view-transition-name: {buttonViewTransitionName}"
						/>
						<span class="sr-only">
							{@render tooltip()}
						</span>
					{/snippet}
				</WhisperingTooltip>
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
