<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { onDestroy } from 'svelte';

	let { recordingId, audioUrl }: { recordingId: string; audioUrl: string } =
		$props();
	onDestroy(() => {
		URL.revokeObjectURL(audioUrl);
	});
</script>

<audio
	class="h-8"
	style="view-transition-name: {createRecordingViewTransitionName({
		recordingId,
		propertyName: 'blob',
	})}"
	controls
	src={audioUrl}
>
	Your browser does not support the audio element.
</audio>
