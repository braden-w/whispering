<script lang="ts">
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

<Tabs.Root
	value={activeTab}
	class="w-full flex flex-col gap-2"
	onValueChange={(v) => (activeTab = v)}
>
	<Tabs.List class="grid w-full grid-cols-2">
		<Tabs.Trigger value="configure">Configure</Tabs.Trigger>
		<Tabs.Trigger value="test">Test</Tabs.Trigger>
	</Tabs.List>

	<Tabs.Content value="configure" class="relative">
		<RenderTransformationConfigurationAndSteps {transformation} {onChange} />
	</Tabs.Content>

	<Tabs.Content value="test">
		<RenderTransformationTest {transformation} />
	</Tabs.Content>
</Tabs.Root>
