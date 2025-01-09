<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { generateDefaultTransformation } from '$lib/services/db';
	import { createTransformationWithToast } from '$lib/transformations/mutations';
	import { PlusIcon } from 'lucide-svelte';
	import RenderTransformation from './-components/RenderTransformation.svelte';

	let isDialogOpen = $state(false);
	let transformation = $state(generateDefaultTransformation());
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props}>
				<PlusIcon class="h-4 w-4 mr-2" />
				Create Transformation
			</Button>
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
			<Dialog.Title>Create Transformation</Dialog.Title>
			<Dialog.Description>
				Create a new transformation to transform text.
			</Dialog.Description>
		</Dialog.Header>
		<RenderTransformation
			{transformation}
			onChange={(newTransformation) => {
				transformation = newTransformation;
			}}
		/>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				type="submit"
				onclick={() =>
					createTransformationWithToast.mutate(
						$state.snapshot(transformation),
						{
							onSuccess: () => {
								isDialogOpen = false;
								transformation = generateDefaultTransformation();
							},
						},
					)}
			>
				Create
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
