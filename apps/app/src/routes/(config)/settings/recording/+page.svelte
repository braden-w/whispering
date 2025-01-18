<script lang="ts">
	import { LabeledSelect } from '$lib/components/labeled/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { userConfiguredServices } from '$lib/services/index.js';
	import { toast } from '$lib/services/toast';
	import { getRecorderFromContext } from '$lib/stores/recorder.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS } from '@repo/shared';

	const recorder = getRecorderFromContext();

	const getMediaDevices = async () => {
		const enumerateRecordingDevicesResult =
			await userConfiguredServices.recorder.enumerateRecordingDevices();
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

	{#await getMediaDevicesPromise}
		<LabeledSelect
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
		<LabeledSelect
			id="recording-device"
			label="Recording Device"
			{items}
			selected={settings.value['recording.selectedAudioInputDeviceId']}
			onSelectedChange={(selected) => {
				void recorder.closeRecordingSessionWithToast();
				settings.value = {
					...settings.value,
					'recording.selectedAudioInputDeviceId': selected,
				};
			}}
			placeholder="Select a device"
		/>
	{:catch error}
		<p>Error with listing media devices: {error.message}</p>
	{/await}

	<LabeledSelect
		id="bit-rate"
		label="Bitrate"
		items={BITRATE_OPTIONS.map((option) => ({
			value: option.value,
			label: option.label,
		}))}
		selected={settings.value['recording.bitrateKbps']}
		onSelectedChange={(selected) => {
			settings.value = {
				...settings.value,
				'recording.bitrateKbps': selected,
			};
		}}
		placeholder="Select a bitrate"
	/>
</div>
