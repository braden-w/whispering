<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import {
		enumerateRecordingDevices,
		mediaStreamManager,
	} from '$lib/services/MediaRecorderService.svelte';
	import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
	import { settings } from '$lib/stores/settings.svelte';
	import { BITRATE_OPTIONS, SUPPORTED_LANGUAGES_OPTIONS } from '@repo/shared';
	import { getVersion } from '@tauri-apps/api/app';
	import { Effect } from 'effect';

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

	const isString = (value: unknown): value is string => typeof value === 'string';
	const versionPromise = (async () => {
		const res = await fetch('https://api.github.com/repos/braden-w/whispering/releases/latest');
		const { html_url: latestReleaseUrl, tag_name: latestVersion } = await res.json();
		if (!isString(latestVersion) || !isString(latestReleaseUrl)) {
			throw new Error('Failed to fetch latest version');
		}
		if (!window.__TAURI__) return { isOutdated: false, version: latestVersion } as const;
		const currentVersion = `v${await getVersion()}`;
		if (latestVersion === currentVersion) {
			return { isOutdated: false, version: currentVersion } as const;
		}
		return { isOutdated: true, latestVersion, currentVersion, latestReleaseUrl } as const;
	})();
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<main class="flex w-full flex-1 items-center justify-center pb-4 pt-2">
	<Card.Root class="w-full max-w-xl">
		<Card.Header>
			<Card.Title class="text-xl">Settings</Card.Title>
			<Card.Description>
				{#await versionPromise}
					Customize your Whispering experience.
				{:then v}
					{#if v.isOutdated}
						{@const { latestVersion, currentVersion, latestReleaseUrl } = v}
						Customize your experience for Whispering {currentVersion} (latest
						<Button
							class="px-0"
							variant="link"
							size="inline"
							href={latestReleaseUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							{latestVersion}
						</Button>).
					{:else}
						{@const { version } = v}
						Customize your experience for Whispering {version}.
					{/if}
				{:catch error}
					Customize your Whispering experience.
				{/await}
			</Card.Description>
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
						label: device.label,
					}))}
					<Select.Root
						{items}
						selected={items.find((item) => item.value === settings.selectedAudioInputDeviceId)}
						onSelectedChange={(selected) => {
							if (!selected) return;
							settings.selectedAudioInputDeviceId = selected.value;
							mediaStreamManager.refreshStream().pipe(Effect.runPromise);
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
				<Label class="text-sm" for="bit-rate">Bitrate</Label>
				<Select.Root
					items={BITRATE_OPTIONS}
					selected={BITRATE_OPTIONS.find((option) => option.value === settings.bitsPerSecond)}
					onSelectedChange={(selected) => {
						if (!selected) return;
						settings.bitsPerSecond = selected.value;
					}}
				>
					<Select.Trigger class="w-full">
						<Select.Value placeholder="Select a device" />
					</Select.Trigger>
					<Select.Content>
						{#each BITRATE_OPTIONS as bitRateOption}
							<Select.Item value={bitRateOption.value} label={bitRateOption.label}>
								{bitRateOption.label}
							</Select.Item>
						{/each}
					</Select.Content>
					<Select.Input name="bit-rate" />
				</Select.Root>
			</div>
			<div class="grid gap-2">
				<Label class="text-sm" for="output-language">Output Language</Label>
				<Select.Root
					items={SUPPORTED_LANGUAGES_OPTIONS}
					selected={selectedLanguageOption}
					onSelectedChange={(selected) => {
						if (!selected) return;
						settings.outputLanguage = selected.value;
					}}
				>
					<Select.Trigger class="w-full">
						<Select.Value placeholder="Select a device" />
					</Select.Trigger>
					<Select.Content class="max-h-96 overflow-auto">
						{#each SUPPORTED_LANGUAGES_OPTIONS as { value, label }}
							<Select.Item {value} {label}>
								{label}
							</Select.Item>
						{/each}
					</Select.Content>
					<Select.Input name="output-language" />
				</Select.Root>
			</div>
			<div class="grid gap-2">
				<Label class="text-sm" for="local-shortcut">Local Shortcut</Label>
				<Input
					id="local-shortcut"
					placeholder="Local Shortcut to toggle recording"
					bind:value={settings.currentLocalShortcut}
					type="text"
					autocomplete="off"
				/>
			</div>
			<div class="grid gap-2">
				<Label class="text-sm" for="global-shortcut">Global Shortcut</Label>
				{#if settings.isGlobalShortcutEnabled}
					<Input
						id="global-shortcut"
						placeholder="Global Shortcut to toggle recording"
						bind:value={settings.currentGlobalShortcut}
						type="text"
						autocomplete="off"
					/>
				{:else}
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
			<div class="grid gap-2">
				<Label class="text-sm" for="api-key">API Key</Label>
				<Input
					id="api-key"
					placeholder="Your OpenAI API Key"
					bind:value={settings.apiKey}
					type="password"
					autocomplete="off"
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
		</Card.Content>
		<Card.Footer>
			<Button onclick={() => window.history.back()} class="w-full" variant="secondary">
				Go Back
			</Button>
		</Card.Footer>
	</Card.Root>
</main>
