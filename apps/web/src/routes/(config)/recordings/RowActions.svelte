<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/create-view-transition-name';
	import { recordings } from '$lib/stores/recordings';
	import { copyRecordingText } from '$lib/system-apis/clipboard';
	import type { Recording } from '@repo/recorder/services/recordings-db';
	import { Button } from '@repo/ui/components/button';
	import * as Dialog from '@repo/ui/components/dialog';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import * as Tooltip from '@repo/ui/components/tooltip';
	import { Effect } from 'effect';
	import ClipboardIcon from '~icons/heroicons/clipboard';
	import LoadingTranscriptionIcon from '~icons/heroicons/ellipsis-horizontal';
	import EditIcon from '~icons/heroicons/pencil';
	import TrashIcon from '~icons/heroicons/trash';
	import StartTranscriptionIcon from '~icons/lucide/play';
	import RetryTranscriptionIcon from '~icons/lucide/repeat';

	export let recording: Recording;
</script>

<div class="flex items-center">
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				on:click={() => recordings.transcribeRecording(recording.id).pipe(Effect.runPromise)}
			>
				{#if recording.transcriptionStatus === 'UNPROCESSED'}
					<StartTranscriptionIcon />
				{:else if recording.transcriptionStatus === 'TRANSCRIBING'}
					<LoadingTranscriptionIcon />
				{:else}
					<RetryTranscriptionIcon />
				{/if}
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Transcribe Recording</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<Dialog.Root>
		<Dialog.Trigger>
			<Tooltip.Root>
				<Tooltip.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="icon">
						<EditIcon />
					</Button>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Edit Recording</p>
				</Tooltip.Content>
			</Tooltip.Root>
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
				on:submit={(e) => {
					e.preventDefault();
					recordings.editRecording(recording).pipe(Effect.runPromise);
				}}
			>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="id" class="text-right">ID</Label>
					<Input id="id" bind:value={recording.id} class="col-span-3" disabled />
				</div>
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
					<Input id="transcribedText" bind:value={recording.transcribedText} class="col-span-3" />
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="blob" class="text-right">Blob</Label>
					<audio
						src={recording.blob ? URL.createObjectURL(recording.blob) : ''}
						controls
						class="col-span-3 mt-2 h-8 w-full"
					/>
				</div>
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="transcriptionStatus" class="text-right">Transcription Status</Label>
					<Input
						id="transcriptionStatus"
						bind:value={recording.transcriptionStatus}
						class="col-span-3"
					/>
				</div>
				<Dialog.Footer>
					<Button type="submit">Save changes</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				on:click={() => copyRecordingText(recording)}
				style="view-transition-name: {createRecordingViewTransitionName({
					recordingId: recording.id,
					propertyName: 'transcribedText'
				})}-copy-button"
			>
				<ClipboardIcon />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Copy Transcript</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				variant="ghost"
				size="icon"
				on:click={() => recordings.deleteRecording(recording.id).pipe(Effect.runPromise)}
			>
				<TrashIcon />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Delete Recording</p>
		</Tooltip.Content>
	</Tooltip.Root>
</div>
