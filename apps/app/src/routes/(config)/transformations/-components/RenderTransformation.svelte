<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import type { Transformation } from '$lib/services/db';
	import { XIcon } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import MarkTransformationActiveButton from '../MarkTransformationActiveButton.svelte';
	import { sidebar } from './EditTransformationSidePanel.svelte';
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
	<div class="flex items-center gap-2">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="configure">Configure</Tabs.Trigger>
			<Tabs.Trigger value="test">Test</Tabs.Trigger>
		</Tabs.List>
		<div class="flex items-center gap-1">
			<MarkTransformationActiveButton size="icon" {transformation} />
			<WhisperingButton
				tooltipContent="Close"
				variant="outline"
				size="icon"
				onclick={() => sidebar.close()}
			>
				<XIcon class="size-4" />
			</WhisperingButton>
		</div>
	</div>

	<Tabs.Content value="configure" class="relative">
		<RenderTransformationConfigurationAndSteps {transformation} {onChange} />
	</Tabs.Content>

	<Tabs.Content value="test">
		<RenderTransformationTest {transformation} />
	</Tabs.Content>
</Tabs.Root>
