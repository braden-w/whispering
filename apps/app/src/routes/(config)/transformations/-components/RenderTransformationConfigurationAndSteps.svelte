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
	import * as Alert from '$lib/components/ui/alert';
	import type { Transformation } from '$lib/services/db';
	import { generateDefaultTransformationStep } from '$lib/services/db';
	import { TRANSFORMATION_STEP_TYPE_OPTIONS } from '$lib/services/db/DbService.dexie';
	import {
		ANTHROPIC_INFERENCE_MODEL_OPTIONS,
		GROQ_INFERENCE_MODEL_OPTIONS,
		INFERENCE_PROVIDER_OPTIONS,
		OPENAI_INFERENCE_MODEL_OPTIONS,
	} from '@repo/shared';
	import { CopyIcon, PlusIcon, TrashIcon } from 'lucide-svelte';
	import AnthropicApiKeyInput from '../../-components/AnthropicApiKeyInput.svelte';
	import GroqApiKeyInput from '../../-components/GroqApiKeyInput.svelte';
	import OpenAiApiKeyInput from '../../-components/OpenAiApiKeyInput.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';

	let {
		transformation,
		onChange,
	}: {
		transformation: Transformation;
		onChange: (transformation: Transformation) => void;
	} = $props();

	let currentlyOpenStepId = $state<string | undefined>();

	function addStep() {
		const updatedTransformation = {
			...transformation,
			steps: [...transformation.steps, generateDefaultTransformationStep()],
		};
		onChange(updatedTransformation);

		if (updatedTransformation.steps.length > 0) {
			const lastStep = updatedTransformation.steps.at(-1);
			currentlyOpenStepId = lastStep?.id;
		}
	}

	function removeStep(index: number) {
		const updatedTransformation = {
			...transformation,
			steps: transformation.steps.filter((_, i) => i !== index),
		};
		onChange(updatedTransformation);
	}

	function duplicateStep(index: number) {
		const stepToDuplicate = transformation.steps[index];
		const duplicatedStep = { ...stepToDuplicate, id: crypto.randomUUID() };
		const updatedTransformation = {
			...transformation,
			steps: [
				...transformation.steps.slice(0, index + 1),
				duplicatedStep,
				...transformation.steps.slice(index + 1),
			],
		};
		onChange(updatedTransformation);
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Configuration</Card.Title>
		<Card.Description>
			Configure the title, description, and steps for your transformation
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

		{#if transformation.steps.length === 0}
			<Alert.Root variant="destructive">
				<Alert.Title>No steps added</Alert.Title>
				<Alert.Description>
					Please add at least one step to your transformation before saving.
				</Alert.Description>
			</Alert.Root>
		{/if}

		<Accordion.Root
			type="single"
			class="w-full space-y-2"
			bind:value={currentlyOpenStepId}
		>
			{#each transformation.steps as step, index}
				{@const stepName = (() => {
					switch (step.type) {
						case 'prompt_transform':
							return 'Prompt Transform';
						case 'find_replace':
							return 'Find Replace';
					}
				})()}
				<Card.Root class="border border-border/50">
					<Card.Content class="p-0">
						<Accordion.Item class="border-0" value={step.id}>
							<div class="flex items-center justify-between px-4 py-2">
								<Accordion.Trigger class="flex-1 hover:no-underline">
									<span class="text-sm font-medium">
										Step {index + 1}: {stepName}
									</span>
								</Accordion.Trigger>
								<div class="flex gap-1">
									<WhisperingButton
										tooltipContent="Duplicate step"
										variant="ghost"
										size="icon"
										class="h-8 w-8"
										onclick={() => duplicateStep(index)}
									>
										<CopyIcon class="h-4 w-4" />
									</WhisperingButton>
									<WhisperingButton
										tooltipContent="Delete step"
										variant="ghost"
										size="icon"
										class="h-8 w-8"
										onclick={() => removeStep(index)}
									>
										<TrashIcon class="h-4 w-4" />
									</WhisperingButton>
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
												id="prompt_transform.inference.provider"
												label="Provider"
												items={INFERENCE_PROVIDER_OPTIONS}
												selected={step['prompt_transform.inference.provider']}
												placeholder="Select a provider"
												onSelectedChange={(value) => {
													step['prompt_transform.inference.provider'] = value;
												}}
											/>

											{#if step['prompt_transform.inference.provider'] === 'OpenAI'}
												<LabeledSelect
													id="prompt_transform.inference.provider.OpenAI.model"
													label="Model"
													items={OPENAI_INFERENCE_MODEL_OPTIONS}
													selected={step[
														'prompt_transform.inference.provider.OpenAI.model'
													]}
													placeholder="Select a model"
													onSelectedChange={(value) => {
														step[
															'prompt_transform.inference.provider.OpenAI.model'
														] = value;
													}}
												/>

												<OpenAiApiKeyInput />
											{:else if step['prompt_transform.inference.provider'] === 'Groq'}
												<LabeledSelect
													id="prompt_transform.inference.provider.Groq.model"
													label="Model"
													items={GROQ_INFERENCE_MODEL_OPTIONS}
													selected={step[
														'prompt_transform.inference.provider.Groq.model'
													]}
													placeholder="Select a model"
													onSelectedChange={(value) => {
														step[
															'prompt_transform.inference.provider.Groq.model'
														] = value;
													}}
												/>

												<GroqApiKeyInput />
											{:else if step['prompt_transform.inference.provider'] === 'Anthropic'}
												<LabeledSelect
													id="prompt_transform.inference.provider.Anthropic.model"
													label="Model"
													items={ANTHROPIC_INFERENCE_MODEL_OPTIONS}
													selected={step[
														'prompt_transform.inference.provider.Anthropic.model'
													]}
													placeholder="Select a model"
													onSelectedChange={(value) => {
														step[
															'prompt_transform.inference.provider.Anthropic.model'
														] = value;
													}}
												/>

												<AnthropicApiKeyInput />
											{/if}

											<LabeledTextarea
												id="prompt_transform.systemPromptTemplate"
												label="System Prompt Template"
												bind:value={step[
													'prompt_transform.systemPromptTemplate'
												]}
												placeholder="Enter system prompt template. Use {'{{input}}'} to reference the input text."
											>
												{#snippet description()}
													{#if step['prompt_transform.systemPromptTemplate'] && !step['prompt_transform.systemPromptTemplate'].includes('{{input}}')}
														<p class="text-destructive text-sm">
															Please include {'{{input}}'} in your template to reference
															the input text
														</p>
													{/if}
												{/snippet}
											</LabeledTextarea>
											<LabeledTextarea
												id="prompt_transform.userPromptTemplate"
												label="User Prompt Template"
												bind:value={step['prompt_transform.userPromptTemplate']}
												placeholder="Enter user prompt template. Use {'{{input}}'} to reference the input text."
											>
												{#snippet description()}
													{#if step['prompt_transform.userPromptTemplate'] && !step['prompt_transform.userPromptTemplate'].includes('{{input}}')}
														<p class="text-destructive text-sm">
															Please include {'{{input}}'} in your template to reference
															the input text
														</p>
													{/if}
												{/snippet}
											</LabeledTextarea>
										</div>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Card.Content>
				</Card.Root>
			{/each}
		</Accordion.Root>

		<Button
			onclick={addStep}
			variant={transformation.steps.length === 0 ? 'default' : 'outline'}
			class="w-full mt-2"
		>
			<PlusIcon class="mr-2 h-4 w-4" />
			Add Step
		</Button>
	</Card.Content>
</Card.Root>
