<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { createCreateTransformationWithToast } from '$lib/mutations/transformations';
	import { generateDefaultTransformation } from '$lib/services/db';
	import RenderTransformation from './RenderTransformation.svelte';

	let transformation = $state(generateDefaultTransformation());
	const createTransformationWithToastMutation =
		createCreateTransformationWithToast();
</script>

<Card.Root class="w-full max-w-4xl">
	<Card.Header>
		<Card.Title>Create Transformation</Card.Title>
		<Card.Description>Configure your transformation</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<RenderTransformation
			{transformation}
			onChange={(newTransformation) => {
				transformation = newTransformation;
			}}
		/>
		<Card.Footer class="flex justify-end gap-2">
			<Button
				onclick={() =>
					createTransformationWithToastMutation.mutate(transformation, {
						onSuccess: () => {
							goto('/transformations');
						},
					})}
			>
				Create Transformation
			</Button>
		</Card.Footer>
	</Card.Content>
</Card.Root>
