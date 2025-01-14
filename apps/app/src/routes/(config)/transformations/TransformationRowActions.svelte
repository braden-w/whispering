<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { deleteTransformationWithToast } from '$lib/query/transformations/mutations';
	import { useTransformationQuery } from '$lib/query/transformations/queries';
	import { cn } from '$lib/utils';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	let { transformationId }: { transformationId: string } = $props();

	const transformationsQuery = useTransformationQuery(() => transformationId);
	const transformation = $derived(transformationsQuery.data);
</script>

<div class="flex items-center gap-1">
	{#if !transformation}
		<Skeleton class="h-8 w-8 md:hidden" />
		<Skeleton class="h-8 w-8" />
	{:else}
		<EditTransformationDialog {transformation} />

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
