<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import type { Transformation } from '$lib/services/db';
	import RenderTransformationSteps from './RenderTransformationSteps.svelte';
	import RenderTransformationTest from './RenderTransformationTest.svelte';

	let {
		transformation,
		onChange,
	}: {
		transformation: Transformation;
		onChange: (transformation: Transformation) => void;
	} = $props();

	let activeTab = $state('steps');
</script>

<div class="space-y-4">
	<Tabs.Root
		value={activeTab}
		class="w-full"
		onValueChange={(v) => (activeTab = v)}
	>
		<Tabs.List class="grid w-full grid-cols-3">
			<Tabs.Trigger value="steps">Steps</Tabs.Trigger>
			<Tabs.Trigger value="configure">Configure</Tabs.Trigger>
			<Tabs.Trigger value="test">Test</Tabs.Trigger>
		</Tabs.List>

		<div class="mt-4">
			<Tabs.Content value="configure">
				<Card.Root>
					<Card.Header>
						<Card.Title>Basic Configuration</Card.Title>
						<Card.Description
							>Configure the basic settings for your transformation</Card.Description
						>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LabeledInput
							id="title"
							label="Title"
							bind:value={transformation.title}
							placeholder="Enter a title"
						/>

						<LabeledInput
							id="description"
							label="Description"
							bind:value={transformation.description}
							placeholder="Enter a description"
						/>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="steps">
				<RenderTransformationSteps {transformation} {onChange} />
			</Tabs.Content>

			<Tabs.Content value="test">
				<RenderTransformationTest {transformation} />
			</Tabs.Content>
		</div>
	</Tabs.Root>
</div>
