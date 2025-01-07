<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { createUpdateTransformationWithToast } from '$lib/mutations/transformations';
	import { type Transformation } from '$lib/services/db';
	import { XIcon } from 'lucide-svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';

	let { selectedEditTransformation, setSelectedTransformation } = $props<{
		selectedEditTransformation: Transformation | null;
		setSelectedTransformation: (transformation: Transformation) => void;
	}>();

	let transformation = $state<Transformation | null>(
		structuredClone($state.snapshot(selectedEditTransformation)),
	);

	$effect(() => {
		transformation = structuredClone(
			$state.snapshot(selectedEditTransformation),
		);
	});

	const updateTransformationWithToastMutation =
		createUpdateTransformationWithToast();
</script>

{#if transformation}
	<RenderTransformation
		{transformation}
		onChange={(newTransformation) => {
			transformation = newTransformation;
			updateTransformationWithToastMutation.mutate(
				$state.snapshot(newTransformation),
			);
		}}
	>
		{#snippet closeButtons()}
			{#if transformation}
				<div class="absolute right-4 top-4">
					<MarkTransformationActiveButton {transformation} />
					<WhisperingButton
						tooltipContent="Close"
						variant="outline"
						size="icon"
						onclick={() => setSelectedTransformation(null)}
					>
						<XIcon class="size-4" />
					</WhisperingButton>
				</div>
			{/if}
		{/snippet}
	</RenderTransformation>
{:else}
	<div class="flex h-[50vh] items-center justify-center rounded-md border">
		<div class="text-center">
			<h3 class="text-lg font-medium">No transformation selected</h3>
			<p class="text-muted-foreground mt-2">
				Select a transformation from the list to edit it
			</p>
		</div>
	</div>
{/if}
