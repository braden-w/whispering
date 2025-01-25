<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import CopyToClipboardButton from '$lib/components/copyable/CopyToClipboardButton.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { useDownloadRecordingWithToast } from '$lib/query/download/mutations';
	import {
		useDeleteRecordingWithToast,
		useUpdateRecordingWithToast,
	} from '$lib/query/recordings/mutations';
	import { useRecordingQuery } from '$lib/query/recordings/queries';
	import type { Recording } from '$lib/services/db';
	import { getTranscriberFromContext } from '$lib/stores/transcriber.svelte';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import { DEBOUNCE_TIME_MS } from '@repo/shared';
	import {
		AlertCircleIcon,
		DownloadIcon,
		LayersIcon,
		Loader2Icon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import EditRecordingDialog from './EditRecordingDialog.svelte';
	import ViewTransformationRunsDialog from './ViewTransformationRunsDialog.svelte';

	const transcriber = getTranscriberFromContext();

	const deleteRecordingWithToast = useDeleteRecordingWithToast();
	const updateRecordingWithToast = useUpdateRecordingWithToast();
	const downloadRecordingWithToast = useDownloadRecordingWithToast();

	let { recordingId }: { recordingId: string } = $props();

	const recordingQuery = useRecordingQuery(() => recordingId);

	const recording = $derived(recordingQuery.data);

	let saveTimeout: NodeJS.Timeout;
	function debouncedSetRecording(newRecording: Recording) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			updateRecordingWithToast.mutate($state.snapshot(newRecording));
		}, DEBOUNCE_TIME_MS);
	}
	$effect(() => {
		return () => clearTimeout(saveTimeout);
	});
</script>

<div class="flex items-center gap-1">
	{#if !recording}
		<Skeleton class="h-8 w-8" />
		<Skeleton class="h-8 w-8" />
		<Skeleton class="h-8 w-8" />
		<Skeleton class="h-8 w-8" />
		<Skeleton class="h-8 w-8" />
	{:else}
		<WhisperingButton
			tooltipContent={recording.transcriptionStatus === 'UNPROCESSED'
				? 'Start transcribing this recording'
				: recording.transcriptionStatus === 'TRANSCRIBING'
					? 'Currently transcribing...'
					: recording.transcriptionStatus === 'DONE'
						? 'Retry transcription'
						: 'Transcription failed - click to try again'}
			onclick={() =>
				transcriber.transcribeAndUpdateRecordingWithToast(recording)}
			variant="ghost"
			size="icon"
		>
			{#if recording.transcriptionStatus === 'UNPROCESSED'}
				<StartTranscriptionIcon class="h-4 w-4" />
			{:else if recording.transcriptionStatus === 'TRANSCRIBING'}
				<LoadingTranscriptionIcon class="h-4 w-4" />
			{:else if recording.transcriptionStatus === 'DONE'}
				<RetryTranscriptionIcon class="h-4 w-4 text-green-500" />
			{:else if recording.transcriptionStatus === 'FAILED'}
				<AlertCircleIcon class="h-4 w-4 text-red-500" />
			{/if}
		</WhisperingButton>

		<EditRecordingDialog
			{recording}
			onChange={(newRecording) => {
				debouncedSetRecording(newRecording);
			}}
		/>

		<CopyToClipboardButton
			label="transcribed text"
			copyableText={recording.transcribedText}
			viewTransitionName={getRecordingTransitionId({
				recordingId,
				propertyName: 'transcribedText',
			})}
		/>

		<CopyToClipboardButton
			label="latest transformation run output"
			copyableText={recording.latestTransformationRunOutput}
			viewTransitionName={getRecordingTransitionId({
				recordingId,
				propertyName: 'latestTransformationRunOutput',
			})}
		>
			{#snippet copyIcon()}
				<LayersIcon />
			{/snippet}
		</CopyToClipboardButton>

		<ViewTransformationRunsDialog {recordingId} />

		<WhisperingButton
			tooltipContent="Download recording"
			onclick={() => downloadRecordingWithToast.mutate(recording)}
			variant="ghost"
			size="icon"
		>
			{#if downloadRecordingWithToast.isPending}
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
					onConfirm: () => deleteRecordingWithToast.mutate(recording),
				});
			}}
			variant="ghost"
			size="icon"
		>
			<TrashIcon class="h-4 w-4" />
		</WhisperingButton>
	{/if}
</div>
