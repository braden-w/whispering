<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import {
		enumerateRecordingDevices,
		mediaStreamManager,
	} from '$lib/services/MediaRecorderService.svelte';
	import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
	import { settings } from '$lib/stores/settings.svelte';
	import {
		BITRATE_OPTIONS,
		SUPPORTED_LANGUAGES_OPTIONS,
		TRANSCRIPTION_SERVICE_OPTIONS,
	} from '@repo/shared';
	import { getVersion } from '@tauri-apps/api/app';
	import { Effect } from 'effect';
	import SettingsLabelInput from './SettingsLabelInput.svelte';
	import SettingsLabelSelect from './SettingsLabelSelect.svelte';

	const getMediaDevicesPromise = enumerateRecordingDevices.pipe(
		Effect.catchAll((error) => {
			renderErrorAsToast(error);
			return Effect.succeed([] as MediaDeviceInfo[]);
		}),
		Effect.runPromise,
	);

	const selectedLanguageOption = $derived(
		SUPPORTED_LANGUAGES_OPTIONS.find((option) => option.value === settings.outputLanguage),
	);

	const selectedTranscriptionServiceOption = $derived(
		TRANSCRIPTION_SERVICE_OPTIONS.find(
			(option) => option.value === settings.selectedTranscriptionService,
		),
	);
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="place-content-center gap-6 sm:grid lg:grid-cols-2">
	<Card.Root class="w-full max-w-xl">
		<Card.Header>
			<Card.Title class="text-xl">General</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			<div class="flex items-center gap-2">
				<Switch
					id="play-sound-enabled"
					aria-labelledby="play-sound-enabled"
					bind:checked={settings.isPlaySoundEnabled}
				/>
				<Label for="play-sound-enabled">Play sound on toggle on and off</Label>
			</div>
			<div class="flex items-center gap-2">
				<Switch
					id="copy-to-clipboard"
					aria-labelledby="copy-to-clipboard"
					bind:checked={settings.isCopyToClipboardEnabled}
				/>
				<Label for="copy-to-clipboard">Copy text to clipboard on successful transcription</Label>
			</div>
			<div class="flex items-center gap-2">
				<Switch
					id="paste-from-clipboard"
					aria-labelledby="paste-from-clipboard"
					bind:checked={settings.isPasteContentsOnSuccessEnabled}
				/>
				<Label for="paste-from-clipboard">
					Paste contents from clipboard after successful transcription
				</Label>
			</div>
		</Card.Content>
	</Card.Root>
	<Card.Root class="w-full max-w-xl">
		<Card.Header>
			<Card.Title class="text-xl">Transcription</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			<div class="grid gap-2">
				<SettingsLabelSelect
					id="selected-transcription-service"
					label="Transcription Service"
					items={TRANSCRIPTION_SERVICE_OPTIONS}
					selected={selectedTranscriptionServiceOption}
					onSelectedChange={(selected) => {
						if (!selected) return;
						settings.selectedTranscriptionService = selected.value;
					}}
					placeholder="Select a transcription service"
				/>
			</div>
			{#if settings.selectedTranscriptionService === 'OpenAI'}
				<div class="grid gap-2">
					<SettingsLabelInput
						id="openai-api-key"
						label="OpenAI API Key"
						placeholder="Your OpenAI API Key"
						bind:value={settings.openAiApiKey}
					/>
					<div class="text-muted-foreground text-sm">
						You can find your API key in your <Button
							variant="link"
							class="px-0.3 py-0.2 h-fit"
							href="https://platform.openai.com/api-keys"
							target="_blank"
							rel="noopener noreferrer"
						>
							account settings
						</Button>. Make sure <Button
							variant="link"
							class="px-0.3 py-0.2 h-fit"
							href="https://platform.openai.com/settings/organization/billing/overview"
							target="_blank"
							rel="noopener noreferrer"
						>
							billing
						</Button>
						is enabled.
					</div>
				</div>
			{:else if settings.selectedTranscriptionService === 'Groq'}
				<div class="grid gap-2">
					<SettingsLabelInput
						id="groq-api-key"
						label="Groq API Key"
						placeholder="Your Groq API Key"
						bind:value={settings.groqApiKey}
					/>
					<div class="text-muted-foreground text-sm">
						You can find your Groq API key in your <Button
							variant="link"
							class="px-0.3 py-0.2 h-fit"
							href="https://console.groq.com/keys"
							target="_blank"
							rel="noopener noreferrer"
						>
							Groq console
						</Button>.
					</div>
				</div>
			{/if}
			<div class="grid gap-2">
				<SettingsLabelSelect
					id="output-language"
					label="Output Language"
					items={SUPPORTED_LANGUAGES_OPTIONS}
					selected={selectedLanguageOption}
					onSelectedChange={(selected) => {
						if (!selected) return;
						settings.outputLanguage = selected.value;
					}}
					placeholder="Select a language"
				/>
			</div>
		</Card.Content>
	</Card.Root>
	<Card.Root class="w-full max-w-xl">
		<Card.Header>
			<Card.Title class="text-xl">Recording</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6"
			><div class="grid gap-2">
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
						selected={items.find((item) => item.value === settings.selectedAudioInputDeviceId)}
						onSelectedChange={(selected) => {
							if (!selected) return;
							settings.selectedAudioInputDeviceId = selected.value;
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
					selected={BITRATE_OPTIONS.find((option) => option.value === settings.bitsPerSecond)}
					onSelectedChange={(selected) => {
						if (!selected) return;
						settings.bitsPerSecond = selected.value;
					}}
					placeholder="Select a bitrate"
				/>
			</div>
		</Card.Content>
		<Card.Footer>
			<Button onclick={() => window.history.back()} class="w-full" variant="secondary">
				Go Back
			</Button>
		</Card.Footer>
	</Card.Root>
	<Card.Root class="w-full max-w-xl">
		<Card.Header>
			<Card.Title class="text-xl">Shortcuts</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-6">
			<div class="grid gap-2">
				<SettingsLabelInput
					id="local-shortcut"
					label="Local Shortcut"
					placeholder="Local Shortcut to toggle recording"
					bind:value={settings.currentLocalShortcut}
				/>
			</div>
			<div class="grid gap-2">
				{#if settings.isGlobalShortcutEnabled}
					<SettingsLabelInput
						id="global-shortcut"
						label="Global Shortcut"
						placeholder="Global Shortcut to toggle recording"
						bind:value={settings.currentGlobalShortcut}
					/>
				{:else}
					<Label class="text-sm" for="global-shortcut">Global Shortcut</Label>
					<div class="relative">
						<Input
							id="global-shortcut"
							placeholder="Global Shortcut to toggle recording"
							bind:value={settings.currentGlobalShortcut}
							type="text"
							autocomplete="off"
							disabled
						/>
						<Button class="absolute inset-0 backdrop-blur" href="/global-shortcut" variant="link">
							Enable Global Shortcut
						</Button>
					</div>
				{/if}
			</div>
		</Card.Content>
		<Card.Footer>
			<Button onclick={() => window.history.back()} class="w-full" variant="secondary">
				Go Back
			</Button>
		</Card.Footer>
	</Card.Root>
</div>
