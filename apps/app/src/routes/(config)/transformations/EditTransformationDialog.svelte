<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { PencilIcon as EditIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		createDeleteTransformationWithToast,
		createUpdateTransformationWithToast,
	} from '$lib/mutations/transformations';
	import type { Transformation } from '$lib/services/db';
	import { Loader2Icon } from 'lucide-svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';
	import MarkTransformationActiveButton from './MarkTransformationActiveButton.svelte';

	let {
		transformation: initialTransformation,
	}: { transformation: Transformation } = $props();
	let transformation = $state(
		structuredClone($state.snapshot(initialTransformation)),
	);

	$effect(() => {
		transformation = structuredClone($state.snapshot(initialTransformation));
	});

	const updateTransformationWithToastMutation =
		createUpdateTransformationWithToast();
	const deleteTransformationWithToastMutation =
		createDeleteTransformationWithToast();

	let isDialogOpen = $state(false);
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<WhisperingButton
				tooltipContent="Edit transformation"
				variant="ghost"
				size="icon"
				{...props}
			>
				<EditIcon class="h-4 w-4" />
			</WhisperingButton>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content
		class="overflow-y-auto max-h-[90vh] max-w-3xl"
		onInteractOutside={(e) => {
			e.preventDefault();
			if (isDialogOpen) {
				confirmationDialog.open({
					title: 'Unsaved changes',
					subtitle: 'You have unsaved changes. Are you sure you want to leave?',
					confirmText: 'Leave',
					onConfirm: () => {
						isDialogOpen = false;
					},
				});
			}
		}}
	>
		<Dialog.Header>
			<Dialog.Title>Edit transformation</Dialog.Title>
			<Dialog.Description>
				Make changes to your transformation here. Click save when you're done.
			</Dialog.Description>
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
				onclick={() =>
					deleteTransformationWithToastMutation.mutate(transformation, {
						onSettled: () => {
							isDialogOpen = false;
						},
					})}
				variant="destructive"
				disabled={deleteTransformationWithToastMutation.isPending}
			>
				{#if deleteTransformationWithToastMutation.isPending}
					<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Delete
			</Button>
			<MarkTransformationActiveButton {transformation} />
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				onclick={() => {
					updateTransformationWithToastMutation.mutate(
						$state.snapshot(transformation),
						{
							onSettled: () => {
								isDialogOpen = false;
							},
						},
					);
				}}
				disabled={updateTransformationWithToastMutation.isPending}
			>
				{#if updateTransformationWithToastMutation.isPending}
					<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Save
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
