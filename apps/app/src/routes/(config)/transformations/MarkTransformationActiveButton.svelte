<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import type { Transformation } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { CheckCircleIcon, CircleIcon } from 'lucide-svelte';

	let { transformation }: { transformation: Transformation } = $props();

	const isTransformationActive = $derived(
		settings.value['transformations.selectedTransformationId'] ===
			transformation.id,
	);
</script>

<WhisperingButton
	tooltipContent={isTransformationActive
		? 'Transformation is active'
		: 'Mark transformation as active'}
	variant="ghost"
	size="icon"
	onclick={() => {
		settings.value = {
			...settings.value,
			'transformations.selectedTransformationId': transformation.id,
		};
	}}
>
	{#if isTransformationActive}
		<CheckCircleIcon class="h-4 w-4 text-green-500" />
	{:else}
		<CircleIcon class="h-4 w-4" />
	{/if}
</WhisperingButton>
