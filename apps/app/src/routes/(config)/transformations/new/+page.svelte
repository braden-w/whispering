<script lang="ts">
	import {
		LabeledInput,
		LabeledSelect,
		LabeledSwitch,
		LabeledTextarea,
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
	import { TRANSFORMATION_STEP_TYPE_OPTIONS } from '$lib/services/db/DbService.dexie';
	import { PlusIcon, TrashIcon, CopyIcon } from 'lucide-svelte';

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

	function duplicateStep(index: number) {
		const stepToDuplicate = transformation.steps[index];
		const duplicatedStep = { ...stepToDuplicate, id: crypto.randomUUID() };
		transformation.steps = [
			...transformation.steps.slice(0, index + 1),
			duplicatedStep,
			...transformation.steps.slice(index + 1),
		];
	}
</script>

<Card.Root class="w-full max-w-4xl">
	<Card.Header>
		<Card.Title>Create New Transformation</Card.Title>
		<Card.Description>
			Configure your transformation's basic information
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<div class="space-y-4">
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
		</div>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between">
				<div>
					<Card.Title>Transformation Steps</Card.Title>
					<Card.Description>
						Configure the steps of your transformation
					</Card.Description>
				</div>
				<Button onclick={addStep} variant="outline" size="sm">
					<PlusIcon class="mr-2 h-4 w-4" />
					Add Step
				</Button>
			</Card.Header>
			<Card.Content class="pt-6">
				<Accordion.Root type="multiple" class="w-full space-y-4">
					{#each transformation.steps as step, index}
						<Card.Root>
							<Card.Content class="p-0">
								<Accordion.Item value={step.id}>
									<div class="flex items-center justify-between px-4 py-2">
										<Accordion.Trigger class="flex-1">
											<span class="text-sm font-medium">
												Step {index + 1}: {step.type === 'prompt_transform'
													? 'Prompt Transform'
													: 'Find Replace'}
											</span>
										</Accordion.Trigger>
										<div class="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												class="h-8 w-8"
												onclick={() => duplicateStep(index)}
											>
												<CopyIcon class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												class="h-8 w-8"
												onclick={() => removeStep(index)}
											>
												<TrashIcon class="h-4 w-4" />
											</Button>
										</div>
									</div>
									<Accordion.Content>
										<div class="space-y-4 p-4 pt-2">
											<LabeledSelect
												id="step-type"
												label="Step Type"
												selected={step.type}
												items={TRANSFORMATION_STEP_TYPE_OPTIONS}
												onSelectedChange={(value) => {
													step.type = value;
												}}
												placeholder="Select a step type"
											/>
											{#if step.type === 'find_replace'}
												<div class="space-y-4">
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
												</div>
											{:else if step.type === 'prompt_transform'}
												<div class="space-y-4">
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
													<LabeledTextarea
														id="prompt_transform.systemPromptTemplate"
														label="System Prompt Template"
														bind:value={step[
															'prompt_transform.systemPromptTemplate'
														]}
														placeholder="Enter system prompt template"
													/>
													<LabeledTextarea
														id="prompt_transform.userPromptTemplate"
														label="User Prompt Template"
														bind:value={step[
															'prompt_transform.userPromptTemplate'
														]}
														placeholder="Enter user prompt template"
													/>
												</div>
											{/if}
										</div>
									</Accordion.Content>
								</Accordion.Item>
							</Card.Content>
						</Card.Root>
					{/each}
				</Accordion.Root>
			</Card.Content>
		</Card.Root>
	</Card.Content>
</Card.Root>
