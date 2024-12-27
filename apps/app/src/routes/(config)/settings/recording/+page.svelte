<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { RecorderService } from '$lib/services/recorder';
	import { toast } from '$lib/utils/toast';
	import { recorder } from '$lib/stores/recorder.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS } from '@repo/shared';
	import SettingsLabelSelect from '../SettingsLabelSelect.svelte';

	const getMediaDevices = async () => {
		const enumerateRecordingDevicesResult =
			await RecorderService.enumerateRecordingDevices();
		if (!enumerateRecordingDevicesResult.ok) {
			toast.warning(enumerateRecordingDevicesResult.error);
			return [];
		}
		return enumerateRecordingDevicesResult.data;
	};
	const getMediaDevicesPromise = getMediaDevices();
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
				items={[]}
				selected={''}
				onSelectedChange={() => {}}
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
				selected={settings.value.selectedAudioInputDeviceId}
				onSelectedChange={async (selected) => {
					if (!selected) return;
					await recorder.closeRecordingSessionWithToast();
					settings.value = {
						...settings.value,
						selectedAudioInputDeviceId: selected,
					};
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
			items={BITRATE_OPTIONS.map((option) => ({
				value: option.value,
				label: option.label,
			}))}
			selected={settings.value.bitrateKbps}
			onSelectedChange={(selected) => {
				if (!selected) return;
				settings.value = {
					...settings.value,
					bitrateKbps: selected,
				};
			}}
			placeholder="Select a bitrate"
		/>
	</div>
</div>
