<script lang="ts">
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';
	import { useLatestTransformationRunByRecordingIdQuery } from '$lib/query/transformationRuns/queries';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';

	let {
		recordingId,
	}: {
		recordingId: string;
	} = $props();

	const { latestTransformationRunByRecordingIdQuery } =
		useLatestTransformationRunByRecordingIdQuery(() => recordingId);

	const id = getRecordingTransitionId({
		recordingId,
		propertyName: 'latestTransformationRunOutput',
	});
</script>

{#if latestTransformationRunByRecordingIdQuery.data?.output}
	<CopyableTextDialog
		{id}
		label="Latest Transformation Run Output"
		text={latestTransformationRunByRecordingIdQuery.data.output}
	/>
{/if}
