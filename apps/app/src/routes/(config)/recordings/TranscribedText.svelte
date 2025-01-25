<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';

	let {
		recordingId,
		transcribedText,
	}: {
		recordingId: string;
		transcribedText: string;
	} = $props();

	const buttonViewTransitionName = createRecordingViewTransitionName({
		recordingId,
		propertyName: 'transcribedText',
	});
</script>

<CopyableTextDialog text={transcribedText} {buttonViewTransitionName} />
