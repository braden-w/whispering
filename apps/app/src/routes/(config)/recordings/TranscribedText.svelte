<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/create-view-transition-name';

	let { recordingId, transcribedText }: { recordingId: string; transcribedText: string } = $props();
</script>

<span
	style="view-transition-name: {createRecordingViewTransitionName({
		recordingId: recordingId,
		propertyName: 'transcribedText'
	})}"
>
	{transcribedText}
</span>
