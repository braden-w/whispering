<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { createDeleteTransformationWithToast } from '$lib/mutations/transformations';
	import type { Transformation } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { CheckCircleIcon, CircleIcon } from 'lucide-svelte';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	let { transformation }: { transformation: Transformation } = $props();

	const isTransformationActive = $derived(
		settings.value['transformations.selectedTransformationId'] ===
			transformation.id,
	);

	const deleteTransformationWithToastMutation =
		createDeleteTransformationWithToast();
</script>

<div class="flex items-center">
	<WhisperingButton
		tooltipContent={isTransformationActive
			? 'Transformation is active'
			: 'Mark transformation as active'}
		variant="ghost"
		size="icon"
		disabled={isTransformationActive}
		onclick={() => {
			settings.value = {
				...settings.value,
				'transformations.selectedTransformationId': transformation.id,
			};
		}}
	>
		{#if isTransformationActive}
			<CheckCircleIcon class="h-4 w-4 text-green-500" />
		{:else}
			<CircleIcon class="h-4 w-4" />
		{/if}
	</WhisperingButton>
	<EditTransformationDialog {transformation}></EditTransformationDialog>

	<WhisperingButton
		tooltipContent="Delete transformation"
		onclick={() => {
			confirmationDialog.open({
				title: 'Delete transformation',
				subtitle: 'Are you sure you want to delete this transformation?',
				confirmText: 'Delete',
				onConfirm: () =>
					deleteTransformationWithToastMutation.mutate(transformation),
			});
		}}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingButton>
</div>
