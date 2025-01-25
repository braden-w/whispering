<script lang="ts">
	import CopyToClipboardButton from '$lib/components/CopyToClipboardButton.svelte';
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

<div class="flex items-center gap-2">
	<CopyableTextPopover text={transcribedText} {buttonViewTransitionName} />
	<CopyToClipboardButton
		label="transcribed text"
		copyableText={transcribedText}
		style="view-transition-name: {buttonViewTransitionName}-copy-button"
	/>
</div>
