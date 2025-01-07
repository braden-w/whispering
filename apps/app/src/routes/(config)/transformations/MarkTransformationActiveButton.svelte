<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import type { Transformation } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { CheckCircleIcon, CircleIcon } from 'lucide-svelte';

	let {
		transformation,
		class: className,
	}: { transformation: Transformation; class?: string } = $props();

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
	class={className}
	onclick={() => {
		if (isTransformationActive) {
			settings.value = {
				...settings.value,
				'transformations.selectedTransformationId': null,
			};
		} else {
			settings.value = {
				...settings.value,
				'transformations.selectedTransformationId': transformation.id,
			};
		}
	}}
>
	{#if isTransformationActive}
		<CheckCircleIcon class="h-4 w-4 text-green-500" />
	{:else}
		<CircleIcon class="h-4 w-4" />
	{/if}
</WhisperingButton>
