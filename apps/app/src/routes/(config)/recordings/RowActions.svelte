<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import {
		ClipboardIcon,
		DownloadIcon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
		TrashIcon,
	} from '$lib/components/icons';
	import type { Recording } from '$lib/services/RecordingDbService';
	import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
	import { recordings } from '$lib/stores/recordings.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { Effect } from 'effect';
	import EditRowDialog from './EditRowDialog.svelte';

	let { recording }: { recording: Recording } = $props();
</script>

<div class="flex items-center">
	<WhisperingButton
		tooltipText="Transcribe recording"
		onclick={() =>
			recordings
				.transcribeRecording(recording.id)
				.pipe(Effect.catchAll(renderErrorAsToast), Effect.runPromise)}
		variant="ghost"
		size="icon"
	>
		{#if recording.transcriptionStatus === 'UNPROCESSED'}
			<StartTranscriptionIcon class="h-4 w-4" />
		{:else if recording.transcriptionStatus === 'TRANSCRIBING'}
			<LoadingTranscriptionIcon class="h-4 w-4" />
		{:else}
			<RetryTranscriptionIcon class="h-4 w-4" />
		{/if}
	</WhisperingButton>

	<EditRowDialog {recording}></EditRowDialog>

	<WhisperingButton
		tooltipText="Copy transcribed text"
		onclick={() => recordings.copyRecordingText(recording)}
		variant="ghost"
		size="icon"
		style="view-transition-name: {createRecordingViewTransitionName({
			recordingId: recording.id,
			propertyName: 'transcribedText',
		})}-copy-button"
	>
		<ClipboardIcon class="h-4 w-4" />
	</WhisperingButton>

	<WhisperingButton
		tooltipText="Download recording"
		onclick={() => recordings.downloadRecording(recording.id)}
		variant="ghost"
		size="icon"
	>
		<DownloadIcon class="h-4 w-4" />
	</WhisperingButton>

	<WhisperingButton
		tooltipText="Delete recording"
		onclick={() => recordings.deleteRecordingById(recording.id)}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingButton>
</div>
