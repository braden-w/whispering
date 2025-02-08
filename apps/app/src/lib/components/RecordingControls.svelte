<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils.js';
	import PersistSelectTransformationCombobox from './PersistSelectTransformationCombobox.svelte';
	import SelectRecordingDeviceCombobox from './SelectRecordingDeviceCombobox.svelte';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex items-center gap-1', className)}>
	<SelectRecordingDeviceCombobox />
	<PersistSelectTransformationCombobox
		selectedTransformationId={settings.value[
			'transformations.selectedTransformationId'
		]}
		onSelect={(transformation) => {
			settings.value = {
				...settings.value,
				'transformations.selectedTransformationId':
					settings.value['transformations.selectedTransformationId'] ===
					transformation.id
						? null
						: transformation.id,
			};
		}}
	/>
</div>
