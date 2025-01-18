<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ListIcon } from 'lucide-svelte';
	import RenderTransformationRuns from '../transformations/-components/RenderTransformationRuns.svelte';

	let { recordingId }: { recordingId: string } = $props();
	let isOpen = $state(false);
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				variant="ghost"
				size="icon"
				tooltipContent="View Transformation Runs"
			>
				<ListIcon class="h-4 w-4" />
			</WhisperingButton>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Transformation Runs</Dialog.Title>
			<Dialog.Description>
				View all transformation runs for this recording
			</Dialog.Description>
		</Dialog.Header>
		<div class="max-h-[60vh] overflow-y-auto">
			<RenderTransformationRuns transformationId={recordingId} />
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isOpen = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
