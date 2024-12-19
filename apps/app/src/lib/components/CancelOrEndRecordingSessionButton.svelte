<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mediaStream } from '$lib/services/MediaStreamService.svelte';
	import { recorder } from '$lib/stores/recorder.svelte';
	import { fasterRerecordExplainedDialog } from './FasterRerecordExplainedDialog.svelte';

	let { class: className }: { class?: string | undefined } = $props();
</script>

{#if recorder.recorderState === 'RECORDING'}
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
{:else if mediaStream.isStreamValid}
	<WhisperingButton
		onclick={mediaStream.destroy}
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
				onclick={() => (fasterRerecordExplainedDialog.isOpen = true)}
			>
				(What's that?)
			</Button>
		{/snippet}
	</WhisperingButton>
{/if}
