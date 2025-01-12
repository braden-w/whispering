<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
	import type { Transformation } from '$lib/services/db';
	import RenderTransformationConfigurationAndSteps from './RenderTransformationConfigurationAndSteps.svelte';
	import RenderTransformationTest from './RenderTransformationTest.svelte';
	import RenderTransformationRuns from './RenderTransformationRuns.svelte';

	let {
		transformation,
		onChange,
	}: {
		transformation: Transformation;
		onChange: (transformation: Transformation) => void;
	} = $props();
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane>
		<RenderTransformationConfigurationAndSteps {transformation} {onChange} />
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
