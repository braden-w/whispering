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
	import { updateTransformation } from '$lib/query/transformations/mutations';
	import { createTransformationQuery } from '$lib/query/transformations/queries';
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
	/>
{/if}
