<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
	import type { Transformation } from '$lib/services/db';
	import RenderTransformationConfigurationAndSteps from './RenderTransformationConfigurationAndSteps.svelte';
	import RenderTransformationRuns from './RenderTransformationRuns.svelte';
	import RenderTransformationTest from './RenderTransformationTest.svelte';

	let {
		transformation,
		setTransformation,
		setTransformationDebounced,
	}: {
		transformation: Transformation;
		setTransformation: (transformation: Transformation) => void;
		setTransformationDebounced: (transformation: Transformation) => void;
	} = $props();
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane>
		<RenderTransformationConfigurationAndSteps
			{transformation}
			{setTransformation}
			{setTransformationDebounced}
		/>
	</Resizable.Pane>
	<Resizable.Handle withHandle />
	<Resizable.Pane>
		<Resizable.PaneGroup direction="vertical">
			<Resizable.Pane>
				<RenderTransformationTest {transformation} />
			</Resizable.Pane>
			<Resizable.Handle withHandle />
			<Resizable.Pane>
				<RenderTransformationRuns transformationId={transformation.id} />
			</Resizable.Pane>
		</Resizable.PaneGroup>
	</Resizable.Pane>
</Resizable.PaneGroup>
