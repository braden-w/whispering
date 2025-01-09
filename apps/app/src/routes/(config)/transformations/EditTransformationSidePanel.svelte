<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { type Transformation } from '$lib/services/db';
	import { updateTransformationWithToast } from '$lib/transformations/mutations';
	import { XIcon } from 'lucide-svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';
	import { createTransformationQuery } from '$lib/transformations/queries';

	let { selectedTransformationId, setSelectedTransformationId } = $props<{
		selectedTransformationId: string;
		setSelectedTransformationId: (transformationId: string | null) => void;
	}>();

	let transformationQuery = createTransformationQuery(selectedTransformationId);
	let transformation = $derived(transformationQuery.data);
</script>

{#if transformation}
	<RenderTransformation
		{transformation}
		onChange={(newTransformation) => {
			updateTransformationWithToast.mutate($state.snapshot(newTransformation));
		}}
	>
		{#snippet closeButtons()}
			{#if transformation}
				<div class="flex items-center absolute right-4 top-4 gap-1">
					<MarkTransformationActiveButton {transformation} />
					<WhisperingButton
						tooltipContent="Close"
						variant="outline"
						size="icon"
						onclick={() => setSelectedTransformationId(null)}
					>
						<XIcon class="size-4" />
					</WhisperingButton>
				</div>
			{/if}
		{/snippet}
	</RenderTransformation>
{/if}
