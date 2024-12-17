<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mediaStreamManager } from '$lib/services/MediaRecorderService.svelte';
	import { recorder } from '$lib/stores/recorder.svelte';
	import { fasterRerecordExplainedDialog } from './FasterRerecordExplainedDialog.svelte';

	let { class: className }: { class?: string | undefined } = $props();
</script>

{#if recorder.recorderState === 'RECORDING'}
	<WhisperingButton
		tooltipText="Cancel recording"
		onclick={recorder.cancelRecording}
		variant="ghost"
		size="icon"
		class={className}
		style="view-transition-name: cancel-icon;"
	>
		🚫
	</WhisperingButton>
{:else if mediaStreamManager.isStreamValid}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child()}
					<Button
						onclick={mediaStreamManager.release}
						variant="ghost"
						size="icon"
						class={className}
						style="view-transition-name: end-session-icon;"
					>
						<span class="sr-only">End recording session</span>
						🔴
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>
				End recording session
				<Button
					variant="link"
					size="inline"
					onclick={() => (fasterRerecordExplainedDialog.isOpen = true)}
				>
					(What's that?)
				</Button>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
