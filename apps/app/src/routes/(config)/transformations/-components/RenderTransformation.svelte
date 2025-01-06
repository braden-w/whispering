<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { Transformation } from '$lib/services/db';
	import RenderTransformationConfigurationAndSteps from './RenderTransformationConfigurationAndSteps.svelte';
	import RenderTransformationTest from './RenderTransformationTest.svelte';

	let {
		transformation,
		onChange,
	}: {
		transformation: Transformation;
		onChange: (transformation: Transformation) => void;
	} = $props();

	let activeTab = $state('configure');
</script>

<div class="space-y-4">
	<Tabs.Root
		value={activeTab}
		class="w-full"
		onValueChange={(v) => (activeTab = v)}
	>
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="configure">Configure</Tabs.Trigger>
			<Tabs.Trigger value="test">Test</Tabs.Trigger>
		</Tabs.List>

		<div class="mt-4">
			<Tabs.Content value="configure">
				<RenderTransformationConfigurationAndSteps
					{transformation}
					{onChange}
				/>
			</Tabs.Content>

			<Tabs.Content value="test">
				<RenderTransformationTest {transformation} />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
