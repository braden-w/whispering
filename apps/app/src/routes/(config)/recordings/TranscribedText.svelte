<script lang="ts">
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';

	let {
		recordingId,
		transcribedText,
	}: {
		recordingId: string;
		transcribedText: string;
	} = $props();

	const id = getRecordingTransitionId({
		recordingId,
		propertyName: 'transcribedText',
	});
</script>

<CopyableTextDialog {id} text={transcribedText} />
