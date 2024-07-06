<script lang="ts">
	import WhisperingButton from '$lib/components/WhisperingButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { mediaStreamManager } from '$lib/services/MediaRecorderService.svelte';
	import { recorder, settings } from '$lib/stores';

	let isAboutRecordingSessionDialogOpen = $state(false);
	let { class: className }: { class?: string | undefined } = $props();
</script>

{#if recorder.recorderState === 'RECORDING'}
	<WhisperingButton
		tooltipText="Cancel recording"
		onclick={() => recorder.cancelRecording(settings)}
		variant="ghost"
		size="icon"
		class={className}
		style="view-transition-name: cancel-icon;"
	>
		🚫
	</WhisperingButton>
{:else if mediaStreamManager.stream}
	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button
				builders={[builder]}
				onclick={mediaStreamManager.release}
				variant="ghost"
				size="icon"
				class={className}
				style="view-transition-name: end-session-icon;"
			>
				<span class="sr-only">End recording session</span>
				🔴
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			End recording session
			<Button
				variant="link"
				size="inline"
				on:click={() => (isAboutRecordingSessionDialogOpen = true)}
			>
				(What's that?)
			</Button>
		</Tooltip.Content>
	</Tooltip.Root>
	<Dialog.Root bind:open={isAboutRecordingSessionDialogOpen}>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>About recording sessions</Dialog.Title>
				<Dialog.Description>Faster re-recording explained</Dialog.Description>
			</Dialog.Header>
			<p>
				Whispering keeps the media stream open after you start recording, enabling quick
				re-recording with reduced latency.
			</p>
			<p>This means your computer will show this tab is still using the microphone.</p>
			<p>When finished, click the 🔴 button to close the stream and end microphone access.</p>
		</Dialog.Content>
	</Dialog.Root>
{/if}
