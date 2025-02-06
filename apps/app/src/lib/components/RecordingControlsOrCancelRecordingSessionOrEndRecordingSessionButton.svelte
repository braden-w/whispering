<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getRecorderFromContext } from '$lib/query/singletons/recorder';
	import { settings } from '$lib/stores/settings.svelte';
	import { fasterRerecordExplainedDialog } from './FasterRerecordExplainedDialog.svelte';
	import PersistSelectTransformationCombobox from './PersistSelectTransformationCombobox.svelte';
	import SelectRecordingDeviceCombobox from './SelectRecordingDeviceCombobox.svelte';
	import { cn } from '$lib/utils.js';

	const recorder = getRecorderFromContext();

	let { class: className }: { class?: string } = $props();
</script>

{#if recorder.recorderState === 'SESSION+RECORDING'}
	<WhisperingButton
		tooltipContent="Cancel recording"
		onclick={() => recorder.cancelRecorderWithToast()}
		variant="ghost"
		size="icon"
		class={className}
		style="view-transition-name: cancel-icon;"
	>
		🚫
	</WhisperingButton>
{:else if recorder.recorderState === 'SESSION'}
	<WhisperingButton
		onclick={() => {
			recorder.closeRecordingSessionWithToast();
		}}
		variant="ghost"
		size="icon"
		class={className}
		style="view-transition-name: end-session-icon;"
	>
		🔴
		{#snippet tooltipContent()}
			End recording session
			<Button
				variant="link"
				size="inline"
				onclick={() => fasterRerecordExplainedDialog.open()}
			>
				(What's that?)
			</Button>
		{/snippet}
	</WhisperingButton>
{:else}
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
{/if}
