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
	import PanelPlaceholder from './PanelPlaceholder.svelte';

	import PanelContent from './panel-content.svelte';

	let { selectedTransformationId } = $props<{
		selectedTransformationId: string | null;
	}>();
</script>

{#if selectedTransformationId}
	<PanelContent {selectedTransformationId} />
{:else}
	<PanelPlaceholder />
{/if}
