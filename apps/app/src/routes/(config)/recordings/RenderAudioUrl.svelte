<script lang="ts">
	import { type Recording } from '$lib/stores/recordings.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { onDestroy } from 'svelte';

	let { id, blob }: Pick<Recording, 'id' | 'blob'> = $props();

	let previousBlobUrl: string | null = null;
	let blobUrl = $derived.by(() => {
		if (!blob) return null;
		const newUrl = URL.createObjectURL(blob);
		if (previousBlobUrl) URL.revokeObjectURL(previousBlobUrl);
		previousBlobUrl = newUrl;
		return newUrl;
	});

	onDestroy(() => {
		if (blobUrl) URL.revokeObjectURL(blobUrl);
	});
</script>

{#if blobUrl}
	<audio
		class="h-8"
		style="view-transition-name: {createRecordingViewTransitionName({
			recordingId: id,
			propertyName: 'blob',
		})}"
		controls
		src={blobUrl}
	>
		Your browser does not support the audio element.
	</audio>
{/if}
