<script lang="ts">
import { onDestroy } from 'svelte';

const { recordingId, audioUrl }: { recordingId: string; audioUrl: string } =
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
