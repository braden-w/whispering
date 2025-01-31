<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getRecorderFromContext } from '$lib/query/recorder/recorder';
	import { nanoid } from 'nanoid/non-secure';
	import { fasterRerecordExplainedDialog } from './FasterRerecordExplainedDialog.svelte';
	import SelectTransformationCombobox from './SelectTransformationCombobox.svelte';
	import { toast } from '$lib/services/toast';

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
	<SelectTransformationCombobox class={className} />
{/if}
