<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import {
		DownloadIcon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import type { Recording } from '$lib/services/RecordingDbService';
	import { toast } from '$lib/services/ToastService';
	import { recordings } from '$lib/stores/recordings.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import EditRowDialog from './EditRowDialog.svelte';
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import { renderErrAsToast } from '$lib/services/renderErrorAsToast';

	let { recording }: { recording: Recording } = $props();
</script>

<div class="flex items-center">
	<WhisperingButton
		tooltipContent="Transcribe recording"
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
	</WhisperingButton>

	<EditRowDialog {recording}></EditRowDialog>

	<WhisperingButton
		tooltipContent="Copy transcribed text"
		onclick={() =>
			recordings.copyRecordingText(recording, {
				onSuccess: (transcribedText) => {
					toast.success({
						title: 'Copied transcription to clipboard!',
						description: transcribedText,
						descriptionClass: 'line-clamp-2',
					});
				},
				onError: renderErrAsToast,
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
		onclick={() =>
			recordings.downloadRecording(recording.id, {
				onSuccess: () => {
					toast.success({
						title: 'Recording downloaded!',
						description: 'Your recording has been downloaded successfully.',
					});
				},
				onError: renderErrAsToast,
			})}
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
				onConfirm: () =>
					recordings.deleteRecordingById(recording.id, {
						onSuccess: () => {
							toast.success({
								title: 'Deleted recording!',
								description: 'Your recording has been deleted successfully.',
							});
						},
						onError: renderErrAsToast,
					}),
			});
		}}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingButton>
</div>
