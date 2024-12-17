<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		enumerateRecordingDevices,
		mediaStreamManager,
	} from '$lib/services/MediaRecorderService.svelte';
	import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS } from '@repo/shared';
	import { Effect } from 'effect';
	import SettingsLabelSelect from '../SettingsLabelSelect.svelte';

	const getMediaDevicesPromise = enumerateRecordingDevices.pipe(
		Effect.catchAll((error) => {
			renderErrorAsToast(error);
			return Effect.succeed([] as MediaDeviceInfo[]);
		}),
		Effect.runPromise,
	);
</script>

<svelte:head>
	<title>Recording Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Recording</h3>
		<p class="text-muted-foreground text-sm">
			Configure your Whispering recording preferences.
		</p>
	</div>
	<Separator />
	<div class="grid gap-2">
		{#await getMediaDevicesPromise}
			<SettingsLabelSelect
				id="recording-device"
				label="Recording Device"
				placeholder="Loading devices..."
				disabled
			/>
		{:then mediaDevices}
			{@const items = mediaDevices.map((device) => ({
				value: device.deviceId,
				label: device.label,
			}))}
			<SettingsLabelSelect
				id="recording-device"
				label="Recording Device"
				{items}
				selected={items.find(
					(item) => item.value === settings.value.selectedAudioInputDeviceId,
				)}
				onSelectedChange={(selected) => {
					if (!selected) return;
					settings.value = {
						...settings.value,
						selectedAudioInputDeviceId: selected.value,
					};
					mediaStreamManager.refreshStream().pipe(Effect.runPromise);
				}}
				placeholder="Select a device"
			/>
		{:catch error}
			<p>Error with listing media devices: {error.message}</p>
		{/await}
	</div>
	<div class="grid gap-2">
		<SettingsLabelSelect
			id="bit-rate"
			label="Bitrate"
			items={BITRATE_OPTIONS}
			selected={BITRATE_OPTIONS.find(
				(option) => option.value === settings.value.bitsPerSecond,
			)}
			onSelectedChange={(selected) => {
				if (!selected) return;
				settings.value = { ...settings.value, bitsPerSecond: selected.value };
			}}
			placeholder="Select a bitrate"
		/>
	</div>
</div>
