<script lang="ts">
	import { recordings } from '$lib/stores';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import type { Recording } from '@repo/services/services/recordings-db';
	import { Button } from '@repo/ui/components/button';
	import * as Dialog from '@repo/ui/components/dialog';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import { Textarea } from '@repo/ui/components/textarea';
	import {
		ClipboardIcon,
		PencilIcon as EditIcon,
		EllipsisHorizontalIcon as LoadingTranscriptionIcon,
		TrashIcon,
	} from '@repo/ui/icons';
	import { Effect } from 'effect';
	import Loader2 from '~icons/lucide/loader-2';
	import StartTranscriptionIcon from '~icons/lucide/play';
	import RetryTranscriptionIcon from '~icons/lucide/repeat';

	let { recording }: { recording: Recording } = $props();

	let isDialogOpen = $state(false);
	let isDeleting = $state(false);
	let isSaving = $state(false);

	const copyThisRecording = () => recordings.copyRecordingText(recording);
</script>

<div class="flex items-center">
	<Button
		variant="ghost"
		size="icon"
		on:click={() => recordings.transcribeRecording(recording.id)}
		title="Transcribe Recording"
	>
		{#if recording.transcriptionStatus === 'UNPROCESSED'}
			<StartTranscriptionIcon />
		{:else if recording.transcriptionStatus === 'TRANSCRIBING'}
			<LoadingTranscriptionIcon />
		{:else}
			<RetryTranscriptionIcon />
		{/if}
	</Button>

	<Dialog.Root bind:open={isDialogOpen}>
		<Dialog.Trigger>
			<Button variant="ghost" size="icon" title="Edit Recording">
				<EditIcon />
			</Button>
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Edit recording</Dialog.Title>
				<Dialog.Description>
					Make changes to your recording here. Click save when you're done.
				</Dialog.Description>
			</Dialog.Header>
			<form
				class="grid gap-4 py-4"
				onsubmit={async (e) => {
					e.preventDefault();
					isSaving = true;
					await recordings.updateRecording(recording).pipe(Effect.runPromise);
					isSaving = false;
					isDialogOpen = false;
				}}
			>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="title" class="text-right">Title</Label>
					<Input id="title" bind:value={recording.title} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="subtitle" class="text-right">Subtitle</Label>
					<Input id="subtitle" bind:value={recording.subtitle} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="timestamp" class="text-right">Timestamp</Label>
					<Input id="timestamp" bind:value={recording.timestamp} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="transcribedText" class="text-right">Transcribed Text</Label>
					<Textarea
						id="transcribedText"
						bind:value={recording.transcribedText}
						class="col-span-3"
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="blob" class="text-right">Blob</Label>
					<audio
						src={recording.blob ? URL.createObjectURL(recording.blob) : ''}
						controls
						class="col-span-3 mt-2 h-8 w-full"
					/>
				</div>
				<Dialog.Footer>
					<Button
						class="mr-auto"
						on:click={async () => {
							isDeleting = true;
							await recordings.deleteRecordingById(recording.id).pipe(Effect.runPromise);
							isDeleting = false;
							isDialogOpen = false;
						}}
						variant="destructive"
						disabled={isDeleting}
					>
						{#if isDeleting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Delete
					</Button>
					<Button on:click={() => (isDialogOpen = false)} variant="secondary">Cancel</Button>
					<Button type="submit" disabled={isSaving}>
						{#if isSaving}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Save
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<Button
		variant="ghost"
		size="icon"
		on:click={copyThisRecording}
		style="view-transition-name: {createRecordingViewTransitionName({
			recordingId: recording.id,
			propertyName: 'transcribedText',
		})}-copy-button"
		title="Copy Transcript"
	>
		<ClipboardIcon />
	</Button>

	<Button
		variant="ghost"
		size="icon"
		on:click={() => recordings.deleteRecordingById(recording.id).pipe(Effect.runPromise)}
		title="Delete Recording"
	>
		<TrashIcon />
	</Button>
</div>
