<script lang="ts">
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';
	import { useLatestTransformationRunByRecordingIdQuery } from '$lib/query/transformationRuns/queries';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';

	let {
		recordingId,
	}: {
		recordingId: string;
	} = $props();

	const latestTransformationRunByRecordingId =
		useLatestTransformationRunByRecordingIdQuery(() => recordingId);

	const id = getRecordingTransitionId({
		recordingId,
		propertyName: 'latestTransformationRunOutput',
	});
</script>

{#if latestTransformationRunByRecordingId.data?.output}
	<CopyableTextDialog
		{id}
		text={latestTransformationRunByRecordingId.data.output}
	/>
{/if}
