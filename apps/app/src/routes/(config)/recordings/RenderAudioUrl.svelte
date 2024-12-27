<script lang="ts">
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { onDestroy } from 'svelte';

	let { recordingId, audioUrl }: { recordingId: string; audioUrl: string } =
		$props();
	let managedAudioUrl = $state<string | null>(null);

	$effect(() => {
		// Only create new URL if audioUrl changes
		if (audioUrl !== managedAudioUrl) {
			// Cleanup old URL if it exists
			if (managedAudioUrl) {
				URL.revokeObjectURL(managedAudioUrl);
			}
			managedAudioUrl = audioUrl;
		}
	});

	onDestroy(() => {
		if (managedAudioUrl) {
			URL.revokeObjectURL(managedAudioUrl);
		}
	});
</script>

{#if managedAudioUrl}
	<audio
		class="h-8"
		style="view-transition-name: {createRecordingViewTransitionName({
			recordingId,
			propertyName: 'blob',
		})}"
		controls
		src={managedAudioUrl}
	>
		Your browser does not support the audio element.
	</audio>
{/if}
