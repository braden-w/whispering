<script lang="ts">
	import { useTransformationRunsByRecordingIdQuery } from '$lib/query/transformationRuns/queries';
	import { createRecordingViewTransitionName } from '$lib/utils/createRecordingViewTransitionName';
	import CopyableTextPopover from './CopyableTextPopover.svelte';
	import ViewTransformationRunsDialog from './ViewTransformationRunsDialog.svelte';

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

<div class="flex items-center gap-2">
	{#if latestTransformationRunByRecordingId?.output}
		<CopyableTextPopover
			text={latestTransformationRunByRecordingId.output}
			{buttonViewTransitionName}
		/>
	{/if}
	<ViewTransformationRunsDialog {recordingId} />
</div>
