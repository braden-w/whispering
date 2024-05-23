<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/create-view-transition-name';

	export let recordingId: string;
	export let transcribedText: string;
</script>

<span
	style="view-transition-name: {createRecordingViewTransitionName({
		recordingId: recordingId,
		propertyName: 'transcribedText'
	})}"
>
	{transcribedText}
</span>
