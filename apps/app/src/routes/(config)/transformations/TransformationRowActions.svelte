<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { deleteTransformationWithToast } from '$lib/transformations/mutations';
	import { createTransformationQuery } from '$lib/transformations/queries';
	import { cn } from '$lib/utils';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	let {
		transformationId,
		class: className,
	}: { transformationId: string; class?: string } = $props();

	const transformationsQuery = createTransformationQuery(transformationId);
	const transformation = $derived(transformationsQuery.data);
</script>

<div class={cn('flex items-center gap-1', className)}>
	{#if !transformation}
		<Skeleton class="h-8 w-8 md:hidden" />
		<Skeleton class="h-8 w-8" />
	{:else}
		<EditTransformationDialog {transformation} class="md:hidden" />

		<WhisperingButton
			tooltipContent="Delete transformation"
			onclick={() => {
				confirmationDialog.open({
					title: 'Delete transformation',
					subtitle: 'Are you sure you want to delete this transformation?',
					confirmText: 'Delete',
					onConfirm: () => deleteTransformationWithToast.mutate(transformation),
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="h-4 w-4" />
		</WhisperingButton>
	{/if}
</div>
