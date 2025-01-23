<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ListIcon } from 'lucide-svelte';
	import RenderTransformationRuns from '../transformations/-components/RenderTransformationRuns.svelte';
	import {
		useLatestTransformationRunByRecordingIdQuery,
		useTransformationRunsByRecordingIdQuery,
	} from '$lib/query/transformationRuns/queries';

	let { recordingId }: { recordingId: string } = $props();

	const latestTransformationRunByRecordingIdQuery =
		useLatestTransformationRunByRecordingIdQuery(() => recordingId);

	const transformationRunsByRecordingIdQuery =
		useTransformationRunsByRecordingIdQuery(() => recordingId);

	let isOpen = $state(false);
</script>

{#if latestTransformationRunByRecordingIdQuery.data}
	<Dialog.Root bind:open={isOpen}>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<WhisperingButton
					{...props}
					variant="outline"
					tooltipContent="View Transformation Runs"
					class="w-full block max-w-md text-left text-sm leading-snug overflow-y-auto h-full max-h-24 text-wrap [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
				>
					{latestTransformationRunByRecordingIdQuery.data?.output}
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
				{#if transformationRunsByRecordingIdQuery.isPending}
					<div class="text-muted-foreground text-sm">Loading runs...</div>
				{:else if transformationRunsByRecordingIdQuery.error}
					<div class="text-destructive text-sm">
						{transformationRunsByRecordingIdQuery.error.title}:
						{transformationRunsByRecordingIdQuery.error.description}
					</div>
				{:else if transformationRunsByRecordingIdQuery.data}
					<RenderTransformationRuns
						runs={transformationRunsByRecordingIdQuery.data}
					/>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (isOpen = false)}>Close</Button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
