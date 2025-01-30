<script lang="ts">
	import { LabeledTextarea } from '$lib/components/labeled/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { useRunTransformationWithToast } from '$lib/query/transformations/mutations';
	import type { Transformation } from '$lib/services/db';
	import { Loader2Icon, PlayIcon } from 'lucide-svelte';

	const { runTransformationWithToast } = useRunTransformationWithToast();

	let { transformation }: { transformation: Transformation } = $props();

	let input = $state('');
	let output = $state('');
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
		onclick={() =>
			runTransformationWithToast.mutate(
				{
					recordingId: null,
					input,
					transformation,
				},
				{
					onSuccess: (o) => {
						if (o) {
							output = o;
						}
					},
				},
			)}
		disabled={runTransformationWithToast.isPending ||
			!input.trim() ||
			transformation.steps.length === 0}
		class="w-full"
	>
		{#if runTransformationWithToast.isPending}
			<Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
		{:else}
			<PlayIcon class="mr-2 h-4 w-4" />
		{/if}
		{runTransformationWithToast.isPending
			? 'Running Transformation...'
			: 'Run Transformation'}
	</Button>
</Card.Content>
