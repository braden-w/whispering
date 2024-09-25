<script lang="ts">
import type { Recording } from '$lib/services/RecordingDbService';

const { recording }: { recording: Recording } = $props();

const isDialogOpen = $state(false);
const isDeleting = $state(false);
const isSaving = $state(false);
</script>

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger>
		<WhisperingButton tooltipText="Edit recording" variant="ghost" size="icon">
			<EditIcon class="h-4 w-4" />
		</WhisperingButton>
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
				await recordings.updateRecording(recording);
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
				<Textarea id="transcribedText" bind:value={recording.transcribedText} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="blob" class="text-right">Blob</Label>
				<audio
					src={recording.blob ? URL.createObjectURL(recording.blob) : ''}
					controls
					class="col-span-3 mt-2 h-8 w-full"
				></audio>
			</div>
			<Dialog.Footer>
				<Button
					class="mr-auto"
					onclick={async () => {
						isDeleting = true;
						await recordings.deleteRecordingById(recording.id);
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
				<Button onclick={() => (isDialogOpen = false)} variant="secondary">Cancel</Button>
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
