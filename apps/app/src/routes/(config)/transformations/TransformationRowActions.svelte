<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { createDeleteTransformationWithToast } from '$lib/mutations/transformations';
	import type { Transformation } from '$lib/services/db';
	import { cn } from '$lib/utils';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	let {
		transformation,
		class: className,
	}: { transformation: Transformation; class?: string } = $props();

	const deleteTransformationWithToastMutation =
		createDeleteTransformationWithToast();
</script>

<div class={cn('flex items-center', className)}>
	<EditTransformationDialog {transformation} class="md:hidden" />

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
