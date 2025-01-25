<script lang="ts">
	import { useTransformationRunsByRecordingIdQuery } from '$lib/query/transformationRuns/queries';
	import { getRecordingTransitionId } from '$lib/utils/getRecordingTransitionId';
	import CopyableTextDialog from '$lib/components/copyable/CopyableTextDialog.svelte';

	let {
		recordingId,
	}: {
		recordingId: string;
	} = $props();

	const transformationRunsByRecordingIdQuery =
		useTransformationRunsByRecordingIdQuery(() => recordingId);

	const latestTransformationRunByRecordingId = $derived(
		transformationRunsByRecordingIdQuery.data?.at(0) ?? null,
	);

	const buttonViewTransitionName = getRecordingTransitionId({
		recordingId,
		propertyName: 'latestTransformationRunOutput',
	});
</script>

{#if latestTransformationRunByRecordingId?.output}
	<CopyableTextDialog
		id={buttonViewTransitionName}
		text={latestTransformationRunByRecordingId.output}
		{buttonViewTransitionName}
	/>
{/if}
