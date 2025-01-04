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
		<WhisperingButton
			tooltipContent="Edit transformation"
			variant="ghost"
			size="icon"
		>
			<EditIcon class="h-4 w-4" />
		</WhisperingButton>
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Edit transformation</Dialog.Title>
			<Dialog.Description>
				Make changes to your transformation here. Click save when you're done.
			</Dialog.Description>
		</Dialog.Header>
		<form
			class="grid gap-4 py-4"
			onsubmit={(e) => {
				e.preventDefault();
				updateTransformationWithToastMutation.mutate(transformation, {
					onSettled: () => {
						isDialogOpen = false;
					},
				});
			}}
		>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="title" class="text-right">Title</Label>
				<Input
					id="title"
					bind:value={transformation.title}
					class="col-span-3"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="description" class="text-right">Description</Label>
				<Textarea
					id="description"
					bind:value={transformation.description}
					class="col-span-3"
				/>
			</div>

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
				<Button onclick={() => (isDialogOpen = false)} variant="secondary">
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={updateTransformationWithToastMutation.isPending}
				>
					{#if updateTransformationWithToastMutation.isPending}
						<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Save
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
