<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { copyTextToClipboardWithToast } from '$lib/query/clipboard/mutations';
	import { createMutation } from '$lib/query/createMutation.svelte';
	import {
		deleteRecordingWithToast,
		updateRecordingWithToast,
	} from '$lib/query/recordings/mutations';
	import { useRecordingQuery } from '$lib/query/recordings/queries';
	import type { Recording } from '$lib/services/db';
	import { DownloadService } from '$lib/services/index.js';
	import { toast } from '$lib/services/toast';
	import { transcriber } from '$lib/stores/transcriber.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { DEBOUNCE_TIME_MS, WhisperingErr } from '@repo/shared';
	import {
		AlertCircleIcon,
		DownloadIcon,
		Loader2Icon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import EditRecordingDialog from './EditRecordingDialog.svelte';

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

	const downloadRecordingWithToast = createMutation(() => ({
		mutationFn: async (recording: Recording) => {
			if (!recording.blob) {
				const e = WhisperingErr({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to download.",
				});
				toast.error(e.error);
				return e;
			}
			const result = await DownloadService.downloadBlob({
				name: `whispering_recording_${recording.id}`,
				blob: recording.blob,
			});
			if (!result.ok) {
				const e = WhisperingErr({
					title: 'Failed to download recording!',
					description: 'Your recording could not be downloaded.',
					action: { type: 'more-details', error: result.error },
				});
				toast.error(e.error);
				return e;
			}

			toast.success({
				title: 'Recording downloading!',
				description: 'Your recording is being downloaded.',
			});
			return result;
		},
	}));
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
				<RetryTranscriptionIcon class="h-4 w-4" />
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

		<WhisperingButton
			tooltipContent="Copy transcribed text"
			onclick={() =>
				copyTextToClipboardWithToast.mutate({
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
