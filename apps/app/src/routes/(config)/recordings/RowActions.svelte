<script lang="ts">
	import type { Recording } from '$lib/services/RecordingDbService';
	import { catchErrorsAsToast } from '$lib/services/errors';
	import { recordings } from '$lib/stores';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		ClipboardIcon,
		PencilIcon as EditIcon,
		Loader2Icon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
		TrashIcon,
	} from '@repo/ui/icons';
	import { Effect } from 'effect';

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
			<StartTranscriptionIcon class="h-4 w-4" />
		{:else if recording.transcriptionStatus === 'TRANSCRIBING'}
			<LoadingTranscriptionIcon class="h-4 w-4" />
		{:else}
			<RetryTranscriptionIcon class="h-4 w-4" />
		{/if}
	</Button>

	<Dialog.Root bind:open={isDialogOpen}>
		<Dialog.Trigger>
			<Button variant="ghost" size="icon" title="Edit Recording">
				<EditIcon class="h-4 w-4" />
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
					await recordings.updateRecording(recording).pipe(catchErrorsAsToast, Effect.runPromise);
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
							await recordings
								.deleteRecordingById(recording.id)
								.pipe(catchErrorsAsToast, Effect.runPromise);
							isDeleting = false;
							isDialogOpen = false;
						}}
						variant="destructive"
						disabled={isDeleting}
					>
						{#if isDeleting}
							<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Delete
					</Button>
					<Button on:click={() => (isDialogOpen = false)} variant="secondary">Cancel</Button>
					<Button type="submit" disabled={isSaving}>
						{#if isSaving}
							<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
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
		<ClipboardIcon class="h-4 w-4" />
	</Button>

	<Button
		variant="ghost"
		size="icon"
		on:click={() =>
			recordings.deleteRecordingById(recording.id).pipe(catchErrorsAsToast, Effect.runPromise)}
		title="Delete Recording"
	>
		<TrashIcon class="h-4 w-4" />
	</Button>
</div>
