<script lang="ts">
	import { recorder, selectedAudioInputDeviceId } from '$lib/stores/recorder';
	import { settings } from '$lib/stores/settings';
	import { TranscriptionServiceLiveWhisper } from '@repo/services/implementations/transcription/whisper.js';
	import { TranscriptionService } from '@repo/services/services/transcription';
	import { Button } from '@repo/ui/components/button';
	import * as Card from '@repo/ui/components/card';
	import { Input } from '@repo/ui/components/input';
	import { Label } from '@repo/ui/components/label';
	import * as Select from '@repo/ui/components/select';
	import { Switch } from '@repo/ui/components/switch';
	import { Effect } from 'effect';

	const getMediaDevicesPromise = recorder.getAudioInputDevices.pipe(Effect.runPromise);

	const supportedLanguagesOptions = Effect.gen(function* (_) {
		const transcriptionService = yield* _(TranscriptionService);
		const languages = yield* _(transcriptionService.getSupportedLanguages);
		return languages;
	}).pipe(Effect.provide(TranscriptionServiceLiveWhisper), Effect.runSync);

	$: selectedLanguageOption = supportedLanguagesOptions.find(
		(option) => option.value === $settings.outputLanguage
	);
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

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
					bind:checked={$settings.isCopyToClipboardEnabled}
				/>
				<Label for="copy-to-clipboard">Copy text to clipboard on successful transcription</Label>
			</div>
			<div class="flex items-center gap-2">
				<Switch
					id="paste-from-clipboard"
					aria-labelledby="paste-from-clipboard"
					bind:checked={$settings.isPasteContentsOnSuccessEnabled}
				/>
				<Label for="paste-from-clipboard">
					Paste contents from clipboard after successful transcription
					<span class="text-muted-foreground">(experimental)</span>
				</Label>
			</div>
			<div class="grid gap-2">
				<Label class="text-sm" for="recording-device">Recording Device</Label>
				{#await getMediaDevicesPromise}
					<Select.Root disabled>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Loading devices..." />
						</Select.Trigger>
					</Select.Root>
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
				<Label class="text-sm" for="output-language">Output Language</Label>
				<Select.Root
					items={supportedLanguagesOptions}
					selected={selectedLanguageOption}
					onSelectedChange={(selected) => {
						if (!selected) return;
						settings.update((settings) => ({
							...settings,
							outputLanguage: selected.value
						}));
					}}
				>
					<Select.Trigger class="w-full">
						<Select.Value placeholder="Select a device" />
					</Select.Trigger>
					<Select.Content class="max-h-96 overflow-auto">
						{#each supportedLanguagesOptions as supportedLanguagesOption}
							<Select.Item
								value={supportedLanguagesOption.value}
								label={supportedLanguagesOption.label}
							>
								{supportedLanguagesOption.label}
							</Select.Item>
						{/each}
					</Select.Content>
					<Select.Input name="output-language" />
				</Select.Root>
			</div>
			<div class="grid gap-2">
				<Label class="text-sm" for="api-key">API Key</Label>
				<Input
					id="api-key"
					placeholder="Your OpenAI API Key"
					bind:value={$settings.apiKey}
					type="text"
					autocomplete="off"
				/>
			</div>
		</Card.Content>
		<Card.Footer>
			<Button href="/" class="w-full" variant="secondary">Go Back</Button>
		</Card.Footer>
	</Card.Root>
</div>
