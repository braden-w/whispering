<script module lang="ts">
	import { useCombobox } from './useCombobox.svelte';

	export const combobox = useCombobox();
</script>

<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { settings } from '$lib/stores/settings.svelte';
	import { MicIcon } from 'lucide-svelte';
	import SelectRecordingDeviceComboboxCommand from './SelectRecordingDeviceComboboxCommand.svelte';
	import WhisperingButton from './WhisperingButton.svelte';

	let { class: className }: { class?: string } = $props();

	const isDeviceSelected = $derived(
		!!settings.value['recording.selectedAudioInputDeviceId'],
	);
</script>

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				class={className}
				tooltipContent={isDeviceSelected
					? 'Change recording device'
					: 'Select a recording device'}
				role="combobox"
				aria-expanded={combobox.open}
				variant="ghost"
				size="icon"
			>
				{#if isDeviceSelected}
					<MicIcon class="h-4 w-4 text-green-500" />
				{:else}
					<MicIcon class="h-4 w-4 text-amber-500" />
				{/if}
				{#if !isDeviceSelected}
					<span
						class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-full before:bg-primary/50 before:animate-ping"
					></span>
				{/if}
			</WhisperingButton>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<SelectRecordingDeviceComboboxCommand
		></SelectRecordingDeviceComboboxCommand>
	</Popover.Content>
</Popover.Root>
