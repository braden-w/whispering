<script lang="ts">
	import { useTransformationRunsByRecordingIdQuery } from '$lib/query/transformationRuns/queries';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
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

	const buttonViewTransitionName = createRecordingViewTransitionName({
		recordingId,
		propertyName: 'latestTransformationRunOutput',
	});
</script>

{#if latestTransformationRunByRecordingId?.output}
	<CopyableTextDialog
		text={latestTransformationRunByRecordingId.output}
		{buttonViewTransitionName}
	/>
{/if}
