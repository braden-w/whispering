<script lang="ts">
	import EditRowDialog from './EditRowDialog.svelte';
	import {
		ClipboardIcon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
		TrashIcon,
	} from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import type { Recording } from '$lib/services/RecordingDbService';
	import { renderErrorAsToast } from '$lib/services/errors';
	import { recordings } from '$lib/stores';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { Effect } from 'effect';

	let { recording }: { recording: Recording } = $props();

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

	<EditRowDialog {recording}></EditRowDialog>

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
			recordings
				.deleteRecordingById(recording.id)
				.pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise)}
		title="Delete Recording"
	>
		<TrashIcon class="h-4 w-4" />
	</Button>
</div>
