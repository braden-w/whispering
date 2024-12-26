<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { recorder } from '$lib/stores/recorder.svelte';
	import { fasterRerecordExplainedDialog } from './FasterRerecordExplainedDialog.svelte';

	let { class: className }: { class?: string | undefined } = $props();
</script>

{#if recorder.recorderState === 'SESSION+RECORDING'}
	<WhisperingButton
		tooltipContent="Cancel recording"
		onclick={recorder.cancelRecording}
		variant="ghost"
		size="icon"
		class={className}
		style="view-transition-name: cancel-icon;"
	>
		🚫
	</WhisperingButton>
{:else if recorder.isInRecordingSession}
	<WhisperingButton
		onclick={recorder.closeRecordingSession}
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
{/if}
