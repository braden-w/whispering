<script lang="ts">
	import { apiKey } from '$lib/stores/apiKey';
	import { recorder, selectedAudioInputDeviceId } from '$lib/stores/recorder';
	import { settings } from '$lib/stores/settings';
	import { Button } from '@repo/ui/components/button';
	import * as Card from '@repo/ui/components/card';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import * as Select from '@repo/ui/components/select';
	import { Switch } from '@repo/ui/components/switch';

	const mediaDevicesPromise = recorder.getAudioInputDevices();
</script>

<div class="container flex items-center justify-center">
	<Card.Root class="w-full max-w-xl">
		<Card.Header>
			<Card.Title>Settings</Card.Title>
			<Card.Description>Customize your Whispering experience</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<div class="flex items-center gap-2">
				<Switch
					id="copy-to-clipboard"
					aria-labelledby="copy-to-clipboard"
					bind:checked={$settings.copyToClipboard}
				/>
				<Label for="copy-to-clipboard">Copy text to clipboard on successful transcription</Label>
			</div>
			<div class="flex items-center gap-2">
				<Switch
					id="paste-from-clipboard"
					aria-labelledby="paste-from-clipboard"
					bind:checked={$settings.pasteContentsOnSuccess}
				/>
				<Label for="paste-from-clipboard">
					Paste contents from clipboard after successful transcription
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400">(experimental)</span>
				</Label>
			</div>
			<div class="grid gap-2">
				<Label class="text-sm" for="recording-device">Recording Device</Label>
				{#await mediaDevicesPromise}
					<p>Loading...</p>
				{:then mediaDevices}
					{@const items = mediaDevices.map((device) => ({
						value: device.deviceId,
						label: device.label
					}))}
					{@const selected = items.find((item) => item.value === $selectedAudioInputDeviceId)}
					<Select.Root
						{items}
						{selected}
						onSelectedChange={(selected) => {
							if (!selected) return;
							selectedAudioInputDeviceId.set(selected.value);
						}}
					>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Select a device" />
						</Select.Trigger>
						<Select.Content>
							{#each mediaDevices as device}
								<Select.Item value={device.deviceId} label={device.label}>
									{device.label}
								</Select.Item>
							{/each}
						</Select.Content>
						<Select.Input name="recording-device" />
					</Select.Root>
				{:catch error}
					<p>Error with listing media devices: {error.message}</p>
				{/await}
			</div>
			<div class="grid gap-2">
				<Label class="text-sm" for="api-key">API Key</Label>
				<Input
					id="api-key"
					placeholder="Your OpenAI API Key"
					bind:value={$apiKey}
					type="text"
					autocomplete="off"
				/>
			</div>
		</Card.Content>
		<Card.Footer>
			<Button size="sm">Save</Button>
			<Button href="/key" variant="link">Edit key</Button>
		</Card.Footer>
	</Card.Root>
</div>
