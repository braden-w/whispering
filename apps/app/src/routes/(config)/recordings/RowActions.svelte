<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import type { Recording } from '$lib/stores/recordings.svelte';
	import { recordings } from '$lib/stores/recordings.svelte';
	import { clipboard } from '$lib/utils/clipboard';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import {
		DownloadIcon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import EditRowDialog from './EditRowDialog.svelte';

	let { recording }: { recording: Recording } = $props();
</script>

<div class="flex items-center">
	<WhisperingButton
		tooltipContent="Transcribe recording"
		onclick={() => recordings.transcribeAndUpdateRecordingWithToast(recording)}
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
		tooltipContent="Copy transcribed text"
		onclick={() =>
			clipboard.copyTextToClipboardWithToast({
				label: 'transcribed text',
				text: recording.transcribedText,
			})}
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
		tooltipContent="Download recording"
		onclick={() => recordings.downloadRecordingWithToast(recording)}
		variant="ghost"
		size="icon"
	>
		<DownloadIcon class="h-4 w-4" />
	</WhisperingButton>

	<WhisperingButton
		tooltipContent="Delete recording"
		onclick={() => {
			confirmationDialog.open({
				title: 'Delete recording',
				subtitle: 'Are you sure you want to delete this recording?',
				onConfirm: () => recordings.deleteRecordingWithToast(recording),
			});
		}}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingButton>
</div>
