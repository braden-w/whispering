<script lang="ts">
	import { LabeledTextarea } from '$lib/components/labeled/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { Transformation } from '$lib/services/db';
	import { generateDefaultTransformationStep } from '$lib/services/db';
	import { runTransformationOnInput } from '$lib/services/transformation/TransformationService';
	import { toast } from '$lib/utils/toast';
	import { PlayIcon } from 'lucide-svelte';

	let { transformation }: { transformation: Transformation } = $props();

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
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Test Transformation</Card.Title>
		<Card.Description
			>Try out your transformation with sample input</Card.Description
		>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Input</Card.Title>
					<Card.Description
						>Enter the text you want to transform</Card.Description
					>
				</Card.Header>
				<Card.Content>
					<LabeledTextarea
						id="input"
						label="Input Text"
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
						label="Output Text"
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
	</Card.Content>
</Card.Root>
