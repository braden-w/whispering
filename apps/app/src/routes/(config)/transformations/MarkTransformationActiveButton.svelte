<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import type { Transformation } from '$lib/services/db';
	import { settings } from '$lib/stores/settings.svelte';
	import { CheckCircleIcon, CircleIcon } from 'lucide-svelte';

	let {
		transformation,
		class: className,
		size = 'default',
	}: {
		transformation: Transformation;
		class?: string;
		size?: 'default' | 'icon';
	} = $props();

	const isTransformationActive = $derived(
		settings.value['transformations.selectedTransformationId'] ===
			transformation.id,
	);

	const displayText = $derived(
		isTransformationActive
			? 'Transformation is active'
			: 'Mark transformation as active',
	);
</script>

<WhisperingButton
	tooltipContent={displayText}
	variant="ghost"
	{size}
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
	{#if size === 'default'}
		{displayText}
	{/if}
	{#if isTransformationActive}
		<CheckCircleIcon class="h-4 w-4 text-green-500" />
	{:else}
		<CircleIcon class="h-4 w-4" />
	{/if}
</WhisperingButton>
