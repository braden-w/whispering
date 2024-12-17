<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';

	let {
		recordingId,
		transcribedText,
	}: { recordingId: string; transcribedText: string } = $props();
</script>

<p
	class="max-h-12 overflow-y-auto"
	style="view-transition-name: {createRecordingViewTransitionName({
		recordingId: recordingId,
		propertyName: 'transcribedText',
	})}"
>
	{transcribedText}
</p>
