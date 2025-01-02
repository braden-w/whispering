<script lang="ts">
	import {
		LabeledInput,
		LabeledSelect,
		LabeledSwitch,
	} from '$lib/components/labeled/index.js';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import type { Transformation } from '$lib/services/db';
	import {
		generateDefaultTransformation,
		generateDefaultTransformationStep,
	} from '$lib/services/db';
	import { PlusIcon, TrashIcon } from 'lucide-svelte';

	let transformation = $state(generateDefaultTransformation());

	function addStep() {
		transformation.steps = [
			...transformation.steps,
			generateDefaultTransformationStep(),
		];
	}

	function removeStep(index: number) {
		transformation.steps = transformation.steps.filter((_, i) => i !== index);
	}
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title>Transformation Details</Card.Title>
		<Card.Description>
			Configure your transformation's basic information
		</Card.Description>
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

<Separator class="my-6" />

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-medium">Transformation Steps</h3>
			<p class="text-sm text-muted-foreground">
				Configure the steps of your transformation
			</p>
		</div>
		<Button onclick={addStep} variant="outline" size="sm">
			<PlusIcon class="mr-2 h-4 w-4" />
			Add Step
		</Button>
	</div>

	<Accordion.Root type="multiple" class="w-full">
		{#each transformation.steps as step, index}
			<Accordion.Item value={step.id}>
				<div class="flex items-center">
					<Accordion.Trigger class="flex-1">
						<span class="text-sm font-medium">
							Step {index + 1}: {step.type === 'prompt_transform'
								? 'Prompt Transform'
								: 'Find Replace'}
						</span>
					</Accordion.Trigger>
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8"
						onclick={() => removeStep(index)}
					>
						<TrashIcon class="h-4 w-4" />
					</Button>
				</div>
				<Accordion.Content>
					<div class="space-y-4 pt-4">
						<LabeledSelect
							id="step-type"
							label="Step Type"
							selected={step.type}
							items={[
								{ value: 'prompt_transform', label: 'Prompt Transform' },
								{ value: 'find_replace', label: 'Find Replace' },
							]}
							onSelectedChange={(value) => {
								step.type = value;
							}}
							placeholder="Select a step type"
						/>
						{#if step.type === 'find_replace'}
							<Card.Root>
								<Card.Content class="space-y-4 pt-6">
									<LabeledInput
										id="find_replace.findText"
										label="Find Text"
										bind:value={step['find_replace.findText']}
										placeholder="Enter text to find"
									/>
									<LabeledInput
										id="find_replace.replaceText"
										label="Replace Text"
										bind:value={step['find_replace.replaceText']}
										placeholder="Enter replacement text"
									/>
									<LabeledSwitch
										id="find_replace.useRegex"
										label="Use Regex"
										checked={step['find_replace.useRegex']}
										onCheckedChange={(v) => {
											step['find_replace.useRegex'] = v;
										}}
									/>
								</Card.Content>
							</Card.Root>
						{:else if step.type === 'prompt_transform'}
							<Card.Root>
								<Card.Content class="space-y-4 pt-6">
									<LabeledSelect
										id="prompt_transform.model"
										label="Model"
										items={[
											{ value: 'gpt-4o', label: 'GPT-4o' },
											{ value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
										]}
										selected={step['prompt_transform.model']}
										placeholder="Select a model"
										onSelectedChange={(value) => {
											step['prompt_transform.model'] = value;
										}}
									/>
									<LabeledInput
										id="prompt_transform.systemPromptTemplate"
										label="System Prompt Template"
										bind:value={step['prompt_transform.systemPromptTemplate']}
										placeholder="Enter system prompt template"
									/>
									<LabeledInput
										id="prompt_transform.userPromptTemplate"
										label="User Prompt Template"
										bind:value={step['prompt_transform.userPromptTemplate']}
										placeholder="Enter user prompt template"
									/>
								</Card.Content>
							</Card.Root>
						{/if}
					</div>
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</div>
