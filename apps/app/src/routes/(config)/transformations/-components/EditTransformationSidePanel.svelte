<script module lang="ts">
	import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
	import { z } from 'zod';

	export const sidebar = createSidebar();

	function createSidebar() {
		let selectedTransformationId = createPersistedState({
			key: 'whispering-transformations-selected-transformation-id',
			defaultValue: null,
			schema: z.string().nullable(),
		});
		return {
			get selectedTransformationId() {
				return selectedTransformationId.value;
			},
			openTransformationById: (id: string) => {
				selectedTransformationId.value = id;
			},
			close: () => {
				selectedTransformationId.value = null;
			},
		};
	}
</script>

<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { updateTransformation } from '$lib/transformations/mutations';
	import { createTransformationQuery } from '$lib/transformations/queries';
	import { XIcon } from 'lucide-svelte';
	import MarkTransformationActiveButton from '../MarkTransformationActiveButton.svelte';
	import RenderTransformation from './RenderTransformation.svelte';

	let { selectedTransformationId }: { selectedTransformationId: string } =
		$props();

	const transformationQuery = createTransformationQuery(
		() => selectedTransformationId,
	);

	const transformation = $derived(transformationQuery.data);
</script>

{#if transformation}
	<RenderTransformation
		{transformation}
		onChange={(newTransformation) => {
			updateTransformation.mutate($state.snapshot(newTransformation));
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
						onclick={() => sidebar.close()}
					>
						<XIcon class="size-4" />
					</WhisperingButton>
				</div>
			{/if}
		{/snippet}
	</RenderTransformation>
{/if}
