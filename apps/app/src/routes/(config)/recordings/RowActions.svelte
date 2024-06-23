<script lang="ts">
	import WhisperingTooltip from '$lib/components/WhisperingTooltip.svelte';
	import {
		ClipboardIcon,
		DownloadIcon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
		TrashIcon,
	} from '$lib/components/icons';
	import type { Recording } from '$lib/services/RecordingDbService';
	import { recordings } from '$lib/stores';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import EditRowDialog from './EditRowDialog.svelte';

	let { recording }: { recording: Recording } = $props();

	const copyThisRecording = () => recordings.copyRecordingText(recording);
</script>

<div class="flex items-center">
	<WhisperingTooltip
		tooltipText="Transcribe Recording"
		onclick={() => recordings.transcribeRecording(recording.id)}
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
	</WhisperingTooltip>

	<EditRowDialog {recording}></EditRowDialog>

	<WhisperingTooltip
		tooltipText="Copy Transcript"
		onclick={copyThisRecording}
		variant="ghost"
		size="icon"
		style="view-transition-name: {createRecordingViewTransitionName({
			recordingId: recording.id,
			propertyName: 'transcribedText',
		})}-copy-button"
	>
		<ClipboardIcon class="h-4 w-4" />
	</WhisperingTooltip>

	<WhisperingTooltip
		tooltipText="Download Recording"
		onclick={() => recordings.downloadRecording(recording.id)}
		variant="ghost"
		size="icon"
	>
		<DownloadIcon class="h-4 w-4" />
	</WhisperingTooltip>

	<WhisperingTooltip
		tooltipText="Delete Recording"
		onclick={() => recordings.deleteRecordingById(recording.id)}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingTooltip>
</div>
