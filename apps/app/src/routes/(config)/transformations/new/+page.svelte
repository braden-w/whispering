<script lang="ts">
	import { createCreateTransformationWithToast } from '$lib/mutations/transformations';
	import { generateDefaultTransformation } from '$lib/services/db';
	import RenderTransformation from './RenderTransformation.svelte';

	let transformation = $state(generateDefaultTransformation());
	const createTransformationWithToastMutation =
		createCreateTransformationWithToast();
</script>

<RenderTransformation
	title="Create New Transformation"
	description="Configure your transformation's basic information"
	{transformation}
	onChange={(newTransformation) => {
		transformation = newTransformation;
	}}
	onSubmit={createTransformationWithToastMutation.mutate}
/>
