<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import { copyRecordingText } from '$lib/mutations/copyRecordingText';
	import { DownloadService } from '$lib/services/DownloadService';
	import type { Recording } from '$lib/services/recordings-db/db/DbService';
	import { toast } from '$lib/services/ToastService';
	import { renderErrAsToast } from '$lib/services/renderErrorAsToast';
	import { RecordingsService } from '$lib/services/recordings/RecordingsDbService.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { createMutation, Ok } from '@repo/shared/epicenter-result';
	import {
		DownloadIcon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import EditRowDialog from './EditRowDialog.svelte';

	let { recording }: { recording: Recording } = $props();

	const downloadRecording = createMutation({
		mutationFn: async (recording: Recording) => {
			const downloadResult = await DownloadService.downloadBlob({
				blob: recording.blob,
				name: `whispering_recording_${recording.id}`,
			});
			if (!downloadResult.ok) return downloadResult;
			return Ok(recording);
		},
		onSuccess: () => {
			toast.success({
				title: 'Recording downloading!',
				description: 'Your recording is being downloaded.',
			});
		},
		onError: (error) => renderErrAsToast(error),
	});
</script>

<div class="flex items-center">
	<WhisperingButton
		tooltipContent="Transcribe recording"
		onclick={() => {
			RecordingsService.transcribeRecording(recording);
		}}
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
		onclick={() => copyRecordingText(recording)}
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
		onclick={() => downloadRecording(recording)}
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
				onConfirm: () => RecordingsService.deleteRecordingById(recording.id),
			});
		}}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingButton>
</div>
