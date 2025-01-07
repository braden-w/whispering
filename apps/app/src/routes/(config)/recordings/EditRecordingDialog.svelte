<script lang="ts">
	import { createUpdateRecordingWithToast } from '$lib/mutations/recordings';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { PencilIcon as EditIcon } from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { createBlobUrlManager } from '$lib/utils/blobUrlManager';
	import type { Recording } from '$lib/services/db';
	import { Loader2Icon } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { createDeleteRecordingWithToast } from '$lib/mutations/recordings';
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';

	let { recording: initialRecording }: { recording: Recording } = $props();
	let recording = $state(structuredClone($state.snapshot(initialRecording)));

	$effect(() => {
		recording = structuredClone($state.snapshot(initialRecording));
	});

	const updateRecordingWithToastMutation = createUpdateRecordingWithToast();
	const deleteRecordingWithToastMutation = createDeleteRecordingWithToast();

	let isDialogOpen = $state(false);

	const blobUrlManager = createBlobUrlManager();

	const blobUrl = $derived.by(() => {
		if (!initialRecording.blob) return undefined;
		return blobUrlManager.createUrl(initialRecording.blob);
	});

	onDestroy(() => {
		blobUrlManager.revokeCurrentUrl();
	});
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<WhisperingButton
				tooltipContent="Edit recording"
				variant="ghost"
				size="icon"
				{...props}
			>
				<EditIcon class="h-4 w-4" />
			</WhisperingButton>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content
		class="overflow-y-auto max-h-[90vh]"
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
			<Dialog.Title>Edit recording</Dialog.Title>
			<Dialog.Description>
				Make changes to your recording here. Click save when you're done.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="title" class="text-right">Title</Label>
				<Input id="title" bind:value={recording.title} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="subtitle" class="text-right">Subtitle</Label>
				<Input
					id="subtitle"
					bind:value={recording.subtitle}
					class="col-span-3"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="timestamp" class="text-right">Created At</Label>
				<Input
					id="timestamp"
					bind:value={recording.timestamp}
					class="col-span-3"
				/>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="transcribedText" class="text-right">Transcribed Text</Label>
				<Textarea
					id="transcribedText"
					bind:value={recording.transcribedText}
					class="col-span-3"
				/>
			</div>
			{#if blobUrl}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="blob" class="text-right">Audio</Label>
					<audio src={blobUrl} controls class="col-span-3 h-8 w-full"></audio>
				</div>
			{/if}
		</div>
		<Dialog.Footer>
			<Button
				class="mr-auto"
				onclick={() =>
					deleteRecordingWithToastMutation.mutate(recording, {
						onSettled: () => {
							isDialogOpen = false;
						},
					})}
				variant="destructive"
				disabled={deleteRecordingWithToastMutation.isPending}
			>
				{#if deleteRecordingWithToastMutation.isPending}
					<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Delete
			</Button>
			<Button variant="outline" onclick={() => (isDialogOpen = false)}>
				Cancel
			</Button>
			<Button
				onclick={() => {
					updateRecordingWithToastMutation.mutate(recording, {
						onSettled: () => {
							isDialogOpen = false;
						},
					});
				}}
				disabled={updateRecordingWithToastMutation.isPending}
			>
				{#if updateRecordingWithToastMutation.isPending}
					<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Save
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
