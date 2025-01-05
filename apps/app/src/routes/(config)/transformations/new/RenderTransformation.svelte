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
	import { toast } from '$lib/utils/toast';
	import type { Transformation } from '$lib/services/db';
	import { generateDefaultTransformationStep } from '$lib/services/db';
	import { TRANSFORMATION_STEP_TYPE_OPTIONS } from '$lib/services/db/DbService.dexie';
	import { CopyIcon, PlusIcon, TrashIcon, PlayIcon } from 'lucide-svelte';
	import {
		INFERENCE_PROVIDER_OPTIONS,
		OPENAI_INFERENCE_MODEL_OPTIONS,
		GROQ_INFERENCE_MODEL_OPTIONS,
		ANTHROPIC_INFERENCE_MODEL_OPTIONS,
	} from '@repo/shared';
	import { runTransformationOnInput } from '$lib/services/transformation/TransformationService';
	import AnthropicApiKeyInput from '../../settings/-components/AnthropicApiKeyInput.svelte';
	import GroqApiKeyInput from '../../settings/-components/GroqApiKeyInput.svelte';
	import OpenAiApiKeyInput from '../../settings/-components/OpenAiApiKeyInput.svelte';

	let {
		transformation,
		onChange,
	}: {
		transformation: Transformation;
		onChange: (transformation: Transformation) => void;
	} = $props();

	let currentlyOpenStepId = $state<string | undefined>();
	let input = $state('');
	let output = $state('');
	let isRunning = $state(false);

	async function runTransformation() {
		if (!input.trim()) {
			toast.error({
				title: 'No input provided',
				description: 'Please enter some text to transform',
			});
			return;
		}

		if (transformation.steps.length === 0) {
			toast.error({
				title: 'No steps configured',
				description: 'Please add at least one transformation step',
			});
			return;
		}

		isRunning = true;
		try {
			const result = await runTransformationOnInput(input, transformation);
			if (!result.ok) {
				toast.error({
					title: result.error.title,
					description: result.error.description,
					action: result.error.action,
				});
				return;
			}
			output = result.data;
			toast.success({
				title: 'Transformation complete',
				description: 'The text has been successfully transformed',
			});
		} catch (error) {
			toast.error({
				title: 'Transformation failed',
				description: 'An unexpected error occurred',
				action: { type: 'more-details', error },
			});
		} finally {
			isRunning = false;
		}
	}

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

<div class="space-y-4">
	<div class="grid grid-cols-2 gap-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>Input</Card.Title>
				<Card.Description>Enter the text you want to transform</Card.Description
				>
			</Card.Header>
			<Card.Content>
				<LabeledTextarea
					id="input"
					bind:value={input}
					placeholder="Enter text to transform..."
					rows={5}
				/>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Output</Card.Title>
				<Card.Description>Transformed text will appear here</Card.Description>
			</Card.Header>
			<Card.Content>
				<LabeledTextarea
					id="output"
					value={output}
					placeholder="Transformed text will appear here..."
					rows={5}
					readonly
				/>
			</Card.Content>
		</Card.Root>
	</div>

	<Button
		onclick={runTransformation}
		disabled={isRunning || !input.trim() || transformation.steps.length === 0}
		class="w-full"
	>
		{#if isRunning}
			<span class="loading loading-spinner loading-sm mr-2"></span>
		{:else}
			<PlayIcon class="mr-2 h-4 w-4" />
		{/if}
		Run Transformation
	</Button>

	<Separator class="my-4" />

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

	<Separator class="my-4" />

	<div>
		<Card.Title class="text-lg mb-2">Transformation Steps</Card.Title>
		<Card.Description class="mb-4">
			Configure the steps of your transformation
		</Card.Description>
	</div>

	<Accordion.Root
		type="single"
		class="w-full space-y-2"
		bind:value={currentlyOpenStepId}
	>
		{#each transformation.steps as step, index}
			<Card.Root class="border border-border/50">
				<Card.Content class="p-0">
					<Accordion.Item class="border-0" value={step.id}>
						<div class="flex items-center justify-between px-4 py-2">
							<Accordion.Trigger class="flex-1 hover:no-underline">
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
											bind:value={step['prompt_transform.systemPromptTemplate']}
											placeholder="Enter system prompt template. Use &lbrace;&lbrace;input&rbrace;&rbrace; to reference the input text."
										/>
										<LabeledTextarea
											id="prompt_transform.userPromptTemplate"
											label="User Prompt Template"
											bind:value={step['prompt_transform.userPromptTemplate']}
											placeholder="Enter user prompt template. Use &lbrace;&lbrace;input&rbrace;&rbrace; to reference the input text."
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

	<Button onclick={addStep} variant="outline" class="w-full mt-2">
		<PlusIcon class="mr-2 h-4 w-4" />
		Add Step
	</Button>
</div>
