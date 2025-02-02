<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { useGetMediaDevices } from '$lib/query/audio/queries';
	import { getRecorderFromContext } from '$lib/query/singletons/recorder';
	import { toast } from '$lib/services/toast';
	import { settings } from '$lib/stores/settings.svelte';
	import { cn } from '$lib/utils';
	import { CheckIcon, MicIcon, MicOffIcon } from 'lucide-svelte';
	import WhisperingButton from './WhisperingButton.svelte';
	import { useCombobox } from './useCombobox.svelte';

	let { class: className }: { class?: string } = $props();

	const recorder = getRecorderFromContext();
	const { getMediaDevicesQuery } = useGetMediaDevices();
	const combobox = useCombobox();

	$effect(() => {
		if (getMediaDevicesQuery.isError) {
			toast.warning(getMediaDevicesQuery.error);
		}
	});

	const selectedDevice = $derived(
		getMediaDevicesQuery.data?.find(
			(device) =>
				device.deviceId ===
				settings.value['recording.selectedAudioInputDeviceId'],
		),
	);
</script>

<Popover.Root bind:open={combobox.open}>
	<Popover.Trigger bind:ref={combobox.triggerRef}>
		{#snippet child({ props })}
			<WhisperingButton
				{...props}
				class={className}
				tooltipContent={selectedDevice
					? 'Change recording device'
					: 'Select a recording device'}
				role="combobox"
				aria-expanded={combobox.open}
				variant="ghost"
				size="icon"
			>
				{#if selectedDevice}
					<MicIcon class="h-4 w-4 text-green-500" />
				{:else}
					<MicOffIcon class="h-4 w-4 text-amber-500" />
				{/if}
				{#if !selectedDevice}
					<span
						class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-full before:bg-primary/50 before:animate-ping"
					></span>
				{/if}
			</WhisperingButton>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 max-w-xl p-0">
		<Command.Root loop>
			<Command.Input placeholder="Select recording device..." />
			<Command.Empty>No recording devices found.</Command.Empty>
			<Command.Group class="overflow-y-auto max-h-[400px]">
				{#if getMediaDevicesQuery.isPending}
					<div class="p-4 text-center text-sm text-muted-foreground">
						Loading devices...
					</div>
				{:else if getMediaDevicesQuery.isError}
					<div class="p-4 text-center text-sm text-destructive">
						{getMediaDevicesQuery.error.title}: {getMediaDevicesQuery.error
							.description}
					</div>
				{:else}
					{#each getMediaDevicesQuery.data as device (device.deviceId)}
						<Command.Item
							value={device.label}
							onSelect={() => {
								recorder.ensureRecordingSessionClosedSilent();
								settings.value = {
									...settings.value,
									'recording.selectedAudioInputDeviceId': device.deviceId,
								};
								combobox.closeAndFocusTrigger();
							}}
							class="flex items-center gap-2 p-2"
						>
							<CheckIcon
								class={cn(
									'h-4 w-4 flex-shrink-0 mx-2',
									settings.value['recording.selectedAudioInputDeviceId'] !==
										device.deviceId && 'text-transparent',
								)}
							/>
							<div class="flex flex-col min-w-0">
								<span class="font-medium truncate">
									{device.label}
								</span>
							</div>
						</Command.Item>
					{/each}
				{/if}
			</Command.Group>
			<Command.Item
				value="Refresh devices"
				onSelect={() => {
					void getMediaDevicesQuery.refetch();
					combobox.closeAndFocusTrigger();
				}}
				class="rounded-none p-2 bg-muted/50 text-muted-foreground"
			>
				<MicIcon class="h-4 w-4 mx-2.5" />
				Refresh devices
			</Command.Item>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
