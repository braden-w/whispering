<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import { createDeleteRecordingWithToast } from '$lib/mutations/recordings';
	import type { Recording } from '$lib/services/db';
	import { userConfiguredServices } from '$lib/services/index.js';
	import { transcriber } from '$lib/stores/transcriber.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { createMutation } from '@tanstack/svelte-query';
	import {
		DownloadIcon,
		Loader2Icon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import EditRecordingDialog from './EditRecordingDialog.svelte';

	let { recording }: { recording: Recording } = $props();

	const downloadRecordingWithToastMutation = createMutation(() => ({
		mutationFn: userConfiguredServices.download.downloadRecordingWithToast,
	}));
	const deleteRecordingWithToastMutation = createDeleteRecordingWithToast();
</script>

<div class="flex items-center">
	<WhisperingButton
		tooltipContent="Transcribe recording"
		onclick={() => transcriber.transcribeAndUpdateRecordingWithToast(recording)}
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

	<EditRecordingDialog {recording}></EditRecordingDialog>

	<WhisperingButton
		tooltipContent="Copy transcribed text"
		onclick={() =>
			userConfiguredServices.clipboard.copyTextToClipboardWithToast({
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
		onclick={() => downloadRecordingWithToastMutation.mutate(recording)}
		variant="ghost"
		size="icon"
	>
		{#if downloadRecordingWithToastMutation.isPending}
			<Loader2Icon class="h-4 w-4 animate-spin" />
		{:else}
			<DownloadIcon class="h-4 w-4" />
		{/if}
	</WhisperingButton>

	<WhisperingButton
		tooltipContent="Delete recording"
		onclick={() => {
			confirmationDialog.open({
				title: 'Delete recording',
				subtitle: 'Are you sure you want to delete this recording?',
				confirmText: 'Delete',
				onConfirm: () => deleteRecordingWithToastMutation.mutate(recording),
			});
		}}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingButton>
</div>
