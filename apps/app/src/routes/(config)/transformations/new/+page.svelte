<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { createTransformationWithToast } from '$lib/query/transformations/mutations';
	import { generateDefaultTransformation } from '$lib/services/db';
	import RenderTransformation from '../-components/RenderTransformation.svelte';

	let transformation = $state(generateDefaultTransformation());
</script>

<Card.Root class="w-full max-w-4xl">
	<Card.Header>
		<Card.Title>Create Transformation</Card.Title>
		<Card.Description>
			Create a new transformation to transform text.
		</Card.Description>
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
					createTransformationWithToast.mutate(
						$state.snapshot(transformation),
						{ onSuccess: () => goto('/transformations') },
					)}
			>
				Create Transformation
			</Button>
		</Card.Footer>
	</Card.Content>
</Card.Root>
