<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import { deleteRecordingWithToast } from '$lib/recordings/mutations';
	import type { Recording } from '$lib/services/db';
	import {
		createResultMutation,
		DownloadService,
		userConfiguredServices,
	} from '$lib/services/index.js';
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
	import { WhisperingErr } from '@repo/shared';
	import { toast } from '$lib/services/toast';
	import { copyTextToClipboardWithToast } from '$lib/clipboard/mutations';
	import { createRecordingQuery } from '$lib/recordings/queries';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { recordingId }: { recordingId: string } = $props();

	const recordingQuery = createRecordingQuery(() => recordingId);

	const recording = $derived(recordingQuery.data);

	const downloadRecordingWithToast = createResultMutation(() => ({
		mutationFn: async (recording: Recording) => {
			if (!recording.blob) {
				return WhisperingErr({
					title: '⚠️ Recording blob not found',
					description: "Your recording doesn't have a blob to download.",
				});
			}
			const result = await DownloadService.downloadBlob({
				name: `whispering_recording_${recording.id}`,
				blob: recording.blob,
			});
			if (!result.ok) {
				return WhisperingErr({
					title: 'Failed to download recording!',
					description: 'Your recording could not be downloaded.',
					action: { type: 'more-details', error: result.error },
				});
			}
			return result;
		},
		onSuccess: () => {
			toast.success({
				title: 'Recording downloading!',
				description: 'Your recording is being downloaded.',
			});
		},
		onError: (error) => {
			toast.error(error);
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
			tooltipContent="Transcribe recording"
			onclick={() =>
				transcriber.transcribeAndUpdateRecordingWithToast(recording)}
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
