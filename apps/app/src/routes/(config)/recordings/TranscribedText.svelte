<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import CopyableTextPopover from './CopyableTextPopover.svelte';

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

<CopyableTextPopover text={transcribedText} {buttonViewTransitionName} />
