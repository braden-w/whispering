<script lang="ts">
	import { LabeledTextarea } from '$lib/components/labeled/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { Transformation } from '$lib/services/db';
	import { RunTransformationService } from '$lib/services/index.js';
	import { toast } from '$lib/services/toast';
	import { createMutation } from '@tanstack/svelte-query';
	import { Loader2Icon, PlayIcon } from 'lucide-svelte';

	let { transformation }: { transformation: Transformation } = $props();

	let input = $state('');
	let output = $state('');

	const runTransformationTest = createMutation(() => ({
		mutationFn: async () => {
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

			const maybeTransformationResult =
				await RunTransformationService.runTransformation({
					recordingId: null,
					input,
					transformation,
				});
			if (!maybeTransformationResult.ok) {
				toast.error({
					title: 'Unexpected database error while running transformation',
					description:
						'The transformation ran as expected but there was an unexpected database error',
					action: {
						type: 'more-details',
						error: maybeTransformationResult.error,
					},
				});
				return;
			}
			const transformationResult = maybeTransformationResult.data;

			if (transformationResult.error) {
				toast.error({
					title: 'Transformation failed',
					description: transformationResult.error,
				});
				return;
			}
			if (transformationResult.output) {
				output = transformationResult.output;
			}

			toast.success({
				title: 'Transformation complete',
				description: 'The text has been successfully transformed',
			});
		},
	}));
</script>

<Card.Header>
	<Card.Title>Test Transformation</Card.Title>
	<Card.Description>
		Try out your transformation with sample input
	</Card.Description>
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
		onclick={() => runTransformationTest.mutate()}
		disabled={runTransformationTest.isPending ||
			!input.trim() ||
			transformation.steps.length === 0}
		class="w-full"
	>
		{#if runTransformationTest.isPending}
			<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
		{:else}
			<PlayIcon class="mr-2 h-4 w-4" />
		{/if}
		{runTransformationTest.isPending
			? 'Running Transformation...'
			: 'Run Transformation'}
	</Button>
</Card.Content>
