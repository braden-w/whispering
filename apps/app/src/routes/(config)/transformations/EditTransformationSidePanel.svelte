<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { updateTransformationWithToast } from '$lib/transformations/mutations';
	import { createTransformationQuery } from '$lib/transformations/queries';
	import { XIcon } from 'lucide-svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';

	let { selectedTransformationId, onClose } = $props<{
		selectedTransformationId: string;
		onClose: () => void;
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
						onclick={() => onClose()}
					>
						<XIcon class="size-4" />
					</WhisperingButton>
				</div>
			{/if}
		{/snippet}
	</RenderTransformation>
{/if}
