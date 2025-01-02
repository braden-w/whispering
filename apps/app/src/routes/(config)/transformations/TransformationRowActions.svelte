<script lang="ts">
	import { confirmationDialog } from '$lib/components/ConfirmationDialog.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { ClipboardIcon, TrashIcon } from '$lib/components/icons';
	import { createDeleteTransformationWithToast } from '$lib/mutations/transformations';
	import type { Transformation } from '$lib/services/db';
	import { transcriber } from '$lib/stores/transcriber.svelte';
	import { clipboard } from '$lib/utils/clipboard';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import {
		DownloadIcon,
		Loader2Icon,
		EllipsisIcon as LoadingTranscriptionIcon,
		RepeatIcon as RetryTranscriptionIcon,
		PlayIcon as StartTranscriptionIcon,
	} from 'lucide-svelte';
	import EditTransformationDialog from './EditTransformationDialog.svelte';

	let { transformation }: { transformation: Transformation } = $props();

	const deleteTransformationWithToastMutation =
		createDeleteTransformationWithToast();
</script>

<div class="flex items-center">
	<EditTransformationDialog {transformation}></EditTransformationDialog>

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
		tooltipContent="Delete transformation"
		onclick={() => {
			confirmationDialog.open({
				title: 'Delete transformation',
				subtitle: 'Are you sure you want to delete this transformation?',
				onConfirm: () =>
					deleteTransformationWithToastMutation.mutate(recording),
			});
		}}
		variant="ghost"
		size="icon"
	>
		<TrashIcon class="h-4 w-4" />
	</WhisperingButton>
</div>
