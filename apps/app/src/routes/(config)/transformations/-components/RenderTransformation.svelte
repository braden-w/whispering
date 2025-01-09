<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import type { Transformation } from '$lib/services/db';
	import type { Snippet } from 'svelte';
	import RenderTransformationConfigurationAndSteps from './RenderTransformationConfigurationAndSteps.svelte';
	import RenderTransformationTest from './RenderTransformationTest.svelte';
	let {
		transformation,
		onChange,
		closeButtons,
	}: {
		transformation: Transformation;
		onChange: (transformation: Transformation) => void;
		closeButtons?: Snippet;
	} = $props();

	let activeTab = $state('configure');
</script>

<div class="space-y-4">
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
			{@render closeButtons?.()}
			<RenderTransformationConfigurationAndSteps {transformation} {onChange} />
		</Tabs.Content>

		<Tabs.Content value="test">
			{@render closeButtons?.()}
			<RenderTransformationTest {transformation} />
		</Tabs.Content>
	</Tabs.Root>
</div>
