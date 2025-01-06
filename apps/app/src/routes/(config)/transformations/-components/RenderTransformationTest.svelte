<script lang="ts">
	import { LabeledTextarea } from '$lib/components/labeled/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { userConfiguredServices } from '$lib/services.svelte';
	import type { Transformation } from '$lib/services/db';
	import { generateDefaultTransformationStep } from '$lib/services/db';
	import { runTransformationOnInput } from '$lib/services/transformation/TransformationService';
	import { settings } from '$lib/stores/settings.svelte';
	import { toast } from '$lib/utils/toast';
	import { createMutation } from '@tanstack/svelte-query';
	import { Loader2Icon, PlayIcon } from 'lucide-svelte';

	let { transformation }: { transformation: Transformation } = $props();

	let input = $state('');
	let output = $state('');

	const runTransformation = createMutation(() => ({
		mutationFn: async () => {
			if (!input.trim()) {
				toast.error({
					title: 'No input provided',
					description: 'Please enter some text to transform',
				});
				throw new Error('No input provided');
			}

			if (transformation.steps.length === 0) {
				toast.error({
					title: 'No steps configured',
					description: 'Please add at least one transformation step',
				});
				throw new Error('No steps configured');
			}

			const result =
				await userConfiguredServices.transformations.runTransformationOnInput({
					input,
					transformation,
				});
			if (!result.ok) {
				toast.error({
					title: result.error.title,
					description: result.error.description,
					action: result.error.action,
				});
				throw result.error;
			}
			return result.data;
		},
		onSuccess: (data) => {
			output = data;
			toast.success({
				title: 'Transformation complete',
				description: 'The text has been successfully transformed',
			});
		},
	}));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Test Transformation</Card.Title>
		<Card.Description
			>Try out your transformation with sample input</Card.Description
		>
	</Card.Header>
	<Card.Content class="space-y-6">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<LabeledTextarea
				id="input"
				label="Input Text"
				bind:value={input}
				placeholder="Enter text to transform..."
				rows={5}
			/>

			<LabeledTextarea
				id="output"
				label="Output Text"
				value={output}
				placeholder="Transformed text will appear here..."
				rows={5}
				readonly
			/>
		</div>

		<Button
			onclick={() => runTransformation.mutate()}
			disabled={runTransformation.isPending ||
				!input.trim() ||
				transformation.steps.length === 0}
			class="w-full"
		>
			{#if runTransformation.isPending}
				<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
			{:else}
				<PlayIcon class="mr-2 h-4 w-4" />
			{/if}
			{runTransformation.isPending
				? 'Running Transformation...'
				: 'Run Transformation'}
		</Button>
	</Card.Content>
</Card.Root>
