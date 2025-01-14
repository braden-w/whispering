<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { PencilIcon as EditIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		deleteTransformationWithToast,
		updateTransformationWithToast,
	} from '$lib/query/transformations/mutations';
	import type { Transformation } from '$lib/services/db';
	import {
		Loader2Icon,
		PlayIcon,
		HistoryIcon,
		TrashIcon,
		XIcon,
	} from 'lucide-svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';

	let {
		transformation,
		class: className,
	}: { transformation: Transformation; class?: string } = $props();

	let isDialogOpen = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout>;

	function debouncedSave(newTransformation: Transformation) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			updateTransformationWithToast.mutate(newTransformation);
		}, 500);
	}

	$effect.root(() => {
		return () => clearTimeout(saveTimeout);
	});

	$effect(() => {
		if (!transformation) return;
		debouncedSave(transformation);
	});
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				tooltipContent="Edit transformation, test transformation, and view run history"
				variant="ghost"
				class={className}
			>
				<EditIcon class="h-4 w-4" />
				<PlayIcon class="h-4 w-4" />
				<HistoryIcon class="h-4 w-4" />
			</WhisperingButton>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[80vh] max-w-7xl h-[80vh]">
		<Dialog.Header>
			<Dialog.Title>Transformation Settings</Dialog.Title>
		</Dialog.Header>

		<RenderTransformation
			{transformation}
			onChange={(newTransformation) => {
				transformation = newTransformation;
			}}
		/>

		<Dialog.Footer>
			<Button
				class="mr-auto"
				onclick={() => {
					confirmationDialog.open({
						title: 'Delete transformation',
						subtitle: 'Are you sure? This action cannot be undone.',
						confirmText: 'Delete',
						onConfirm: () => {
							deleteTransformationWithToast.mutate(
								$state.snapshot(transformation),
								{
									onSettled: () => {
										isDialogOpen = false;
									},
								},
							);
						},
					});
				}}
				variant="destructive"
				disabled={deleteTransformationWithToast.isPending}
			>
				{#if deleteTransformationWithToast.isPending}
					<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
				{:else}
					<TrashIcon class="h-4 w-4 mr-1" />
				{/if}
				Delete
			</Button>
			<MarkTransformationActiveButton {transformation} />
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
