<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { PencilIcon as EditIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		createDeleteTransformationWithToast,
		createUpdateTransformationWithToast,
	} from '$lib/mutations/transformations';
	import type { Transformation } from '$lib/services/db';
	import { Loader2Icon } from 'lucide-svelte';
	import RenderTransformation from './new/RenderTransformation.svelte';

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
	<Dialog.Content class="overflow-y-auto max-h-[90vh] max-w-3xl">
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
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				type="submit"
				onclick={() =>
					updateTransformationWithToastMutation.mutate(
						$state.snapshot(transformation),
						{
							onSuccess: () => {
								isDialogOpen = false;
							},
						},
					)}
			>
				Create
			</Button>
		</Dialog.Footer>
		<Dialog.Footer>
			<Button
				onclick={() => {
					updateTransformationWithToastMutation.mutate(transformation);
				}}
			>
				Save
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
