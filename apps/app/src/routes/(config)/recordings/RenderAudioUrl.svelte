<script lang="ts">
	import { createBlobUrlManager } from '$lib/services/BlobToUrlService';
	import { type Recording } from '$lib/stores/recordings.svelte';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import { onDestroy } from 'svelte';

	let { id, blob }: Pick<Recording, 'id' | 'blob'> = $props();

	const blobUrlManager = createBlobUrlManager();

	const blobUrl = $derived.by(() => {
		if (!blob) return undefined;
		return blobUrlManager.createUrl(blob);
	});

	onDestroy(() => {
		blobUrlManager.revokeCurrentUrl();
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
