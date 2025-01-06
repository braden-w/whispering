<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { createDeleteTransformationWithToast } from '$lib/mutations/transformations';
	import type { Transformation } from '$lib/services/db';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	let { transformation }: { transformation: Transformation } = $props();

	const deleteTransformationWithToastMutation =
		createDeleteTransformationWithToast();
</script>

<div class="flex items-center">
	<EditTransformationDialog {transformation}></EditTransformationDialog>

	<WhisperingButton
		tooltipContent="Delete transformation"
		onclick={() => {
			confirmationDialog.open({
				title: 'Delete transformation',
				subtitle: 'Are you sure you want to delete this transformation?',
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
