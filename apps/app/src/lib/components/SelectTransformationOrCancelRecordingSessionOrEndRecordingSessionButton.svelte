<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getRecorderFromContext } from '$lib/query/recorder/recorder';
	import { settings } from '$lib/stores/settings.svelte';
	import { fasterRerecordExplainedDialog } from './FasterRerecordExplainedDialog.svelte';
	import SelectTransformationCombobox from './SelectTransformationCombobox.svelte';

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
			recorder.ensureRecordingSessionClosedWithToast();
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
	<SelectTransformationCombobox
		class={className}
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
{/if}
