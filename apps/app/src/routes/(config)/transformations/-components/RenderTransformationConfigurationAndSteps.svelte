<script lang="ts">
	import { slide } from 'svelte/transition';
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
	import {
		TRANSFORMATION_STEP_TYPES,
		TRANSFORMATION_STEP_TYPES_TO_LABELS,
	} from '$lib/services/db/DbService';
	import {
		ANTHROPIC_INFERENCE_MODEL_OPTIONS,
		GROQ_INFERENCE_MODEL_OPTIONS,
		INFERENCE_PROVIDER_OPTIONS,
		OPENAI_INFERENCE_MODEL_OPTIONS,
	} from '@repo/shared';
	import {
		CopyIcon,
		PlusIcon,
		TrashIcon,
		ChevronDownIcon,
	} from 'lucide-svelte';
	import AnthropicApiKeyInput from '../../-components/AnthropicApiKeyInput.svelte';
	import GroqApiKeyInput from '../../-components/GroqApiKeyInput.svelte';
	import OpenAiApiKeyInput from '../../-components/OpenAiApiKeyInput.svelte';
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Separator } from '$lib/components/ui/separator';

	let {
		transformation,
		onChange,
	}: {
		transformation: Transformation;
		onChange: (transformation: Transformation) => void;
	} = $props();

	function addStep() {
		const updatedTransformation = {
			...transformation,
			steps: [...transformation.steps, generateDefaultTransformationStep()],
		};
		onChange(updatedTransformation);
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

<div class="overflow-y-auto h-full">
	<Card.Header>
		<Card.Title>Configuration</Card.Title>
		<Card.Description>
			Configure the title, description, and steps for your transformation
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-8">
		<section class="space-y-4">
			<LabeledInput
				id="title"
				label="Title"
				value={transformation.title}
				oninput={(e) => {
					onChange({
						...transformation,
						title: e.currentTarget.value,
					});
				}}
				placeholder="Enter a descriptive title for this transformation"
				description="A clear, concise name that describes what this transformation does"
			/>
			<LabeledTextarea
				id="description"
				label="Description"
				value={transformation.description}
				oninput={(e) => {
					onChange({
						...transformation,
						description: e.currentTarget.value,
					});
				}}
				placeholder="Explain how this transformation works and when to use it"
				description="Provide details about the transformation's purpose and expected outcomes"
			/>
		</section>

		<Separator />

		<section class="space-y-4">
			<h3 class="font-medium mb-4">Transformation Steps</h3>
			{#if transformation.steps.length === 0}
				<Alert.Root variant="warning">
					<Alert.Title>No steps added</Alert.Title>
					<Alert.Description>
						Please add at least one step to your transformation for it to work.
					</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="space-y-4">
				{#each transformation.steps as step, index (index)}
					<div transition:slide>
						<Card.Root class="bg-muted/25">
							<Card.Header class="space-y-3">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Card.Title class="text-xl">
											Step {index + 1}:
										</Card.Title>
										<LabeledSelect
											id="step-type"
											label="Type"
											selected={step.type}
											items={TRANSFORMATION_STEP_TYPES.map(
												(type) =>
													({
														value: type,
														label: TRANSFORMATION_STEP_TYPES_TO_LABELS[type],
													}) as const,
											)}
											onSelectedChange={(value) => {
												onChange({
													...transformation,
													steps: transformation.steps.map((s, i) =>
														i === index ? { ...s, type: value } : s,
													),
												});
											}}
											hideLabel
											class="h-8"
											placeholder="Select a step type"
										/>
									</div>
									<div class="flex gap-1 items-center">
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
								{#if step.type === 'prompt_transform'}
									<Card.Description>
										{index === 0
											? `'{{input}}' is the user input`
											: `'{{input}}' is the output from the previous step`}
									</Card.Description>
								{/if}
							</Card.Header>
							<Card.Content>
								{#if step.type === 'find_replace'}
									<div class="space-y-4">
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											<LabeledInput
												id="find_replace.findText"
												label="Find Text"
												value={step['find_replace.findText']}
												oninput={(e) => {
													onChange({
														...transformation,
														steps: transformation.steps.map((s, i) =>
															i === index
																? {
																		...s,
																		'find_replace.findText':
																			e.currentTarget.value,
																	}
																: s,
														),
													});
												}}
												placeholder="Enter text to find"
											/>
											<LabeledInput
												id="find_replace.replaceText"
												label="Replace Text"
												value={step['find_replace.replaceText']}
												oninput={(e) => {
													onChange({
														...transformation,
														steps: transformation.steps.map((s, i) =>
															i === index
																? {
																		...s,
																		'find_replace.replaceText':
																			e.currentTarget.value,
																	}
																: s,
														),
													});
												}}
												placeholder="Enter replacement text"
											/>
										</div>
										<Accordion.Root type="single" class="w-full">
											<Accordion.Item class="border-none" value="advanced">
												<Accordion.Trigger class="text-sm">
													Advanced Options
												</Accordion.Trigger>
												<Accordion.Content>
													<LabeledSwitch
														id="find_replace.useRegex"
														label="Use Regex"
														checked={step['find_replace.useRegex']}
														onCheckedChange={(v) => {
															step['find_replace.useRegex'] = v;
														}}
														description="Enable regular expressions for more advanced text matching patterns"
													/>
												</Accordion.Content>
											</Accordion.Item>
										</Accordion.Root>
									</div>
								{:else if step.type === 'prompt_transform'}
									<div class="space-y-4">
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
											{/if}
										</div>

										<LabeledTextarea
											id="prompt_transform.systemPromptTemplate"
											label="System Prompt Template"
											value={step['prompt_transform.systemPromptTemplate']}
											oninput={(e) => {
												onChange({
													...transformation,
													steps: transformation.steps.map((s, i) =>
														i === index
															? {
																	...s,
																	'prompt_transform.systemPromptTemplate':
																		e.currentTarget.value,
																}
															: s,
													),
												});
											}}
											placeholder="Example: You are an expert proofreader. Please take in the following text and correct any grammatical errors"
										/>
										<LabeledTextarea
											id="prompt_transform.userPromptTemplate"
											label="User Prompt Template"
											value={step['prompt_transform.userPromptTemplate']}
											oninput={(e) => {
												onChange({
													...transformation,
													steps: transformation.steps.map((s, i) =>
														i === index
															? {
																	...s,
																	'prompt_transform.userPromptTemplate':
																		e.currentTarget.value,
																}
															: s,
													),
												});
											}}
											placeholder="Example: Please analyze this text and improve its clarity: {'{{input}}'}"
										>
											{#snippet description()}
												{#if step['prompt_transform.userPromptTemplate'] && !step['prompt_transform.userPromptTemplate'].includes('{{input}}')}
													<p class="text-amber-500 text-sm font-semibold">
														Please include {'{{input}}'} in your template to inject
														the input text into the prompt!
													</p>
												{/if}
											{/snippet}
										</LabeledTextarea>
										<Accordion.Root type="single" class="w-full">
											<Accordion.Item class="border-none" value="advanced">
												<Accordion.Trigger class="text-sm">
													Advanced Options
												</Accordion.Trigger>
												<Accordion.Content>
													{#if step['prompt_transform.inference.provider'] === 'OpenAI'}
														<OpenAiApiKeyInput />
													{:else if step['prompt_transform.inference.provider'] === 'Groq'}
														<GroqApiKeyInput />
													{:else if step['prompt_transform.inference.provider'] === 'Anthropic'}
														<AnthropicApiKeyInput />
													{/if}
												</Accordion.Content>
											</Accordion.Item>
										</Accordion.Root>
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					</div>
				{/each}
			</div>

			<Button
				onclick={addStep}
				variant={transformation.steps.length === 0 ? 'default' : 'outline'}
				class="w-full mt-2"
			>
				<PlusIcon class="mr-2 h-4 w-4" />
				Add Step
			</Button>
		</section>
	</Card.Content>
</div>
