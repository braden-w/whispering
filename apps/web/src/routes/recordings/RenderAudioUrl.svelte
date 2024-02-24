<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/create-view-transition-name';
	import { onDestroy } from 'svelte';

	export let recordingId: string;
	export let audioUrl: string;
	onDestroy(() => {
		URL.revokeObjectURL(audioUrl);
	});
</script>

<audio
	style="view-transition-name: {createRecordingViewTransitionName({
		recordingId,
		propertyName: 'blob'
	})}"
	controls
	src={audioUrl}
>
	Your browser does not support the audio element.
</audio>
