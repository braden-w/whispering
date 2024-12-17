<script lang="ts">
	import { fasterRerecordExplainedDialog } from '$lib/components/FasterRerecordExplainedDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { setAlwaysOnTopToTrueIfAlwaysInSettings } from '$lib/services/AlwaysOnTopService';
	import { settings } from '$lib/stores/settings.svelte';
	import { ALWAYS_ON_TOP_OPTIONS } from '@repo/shared';
	import SettingsLabelSelect from './SettingsLabelSelect.svelte';
</script>

<svelte:head>
	<title>Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">General</h3>
		<p class="text-muted-foreground text-sm">
			Configure your general Whispering preferences.
		</p>
	</div>
	<Separator />
	<div class="flex items-center gap-2">
		<Switch
			id="play-sound-enabled"
			aria-labelledby="play-sound-enabled"
			checked={settings.value.isPlaySoundEnabled}
			onCheckedChange={(v) => {
				settings.value = { ...settings.value, isPlaySoundEnabled: v };
			}}
		/>
		<Label for="play-sound-enabled">Play sound on toggle on and off</Label>
	</div>
	<div class="flex items-center gap-2">
		<Switch
			id="copy-to-clipboard"
			aria-labelledby="copy-to-clipboard"
			checked={settings.value.isCopyToClipboardEnabled}
			onCheckedChange={(v) => {
				settings.value = { ...settings.value, isCopyToClipboardEnabled: v };
			}}
		/>
		<Label for="copy-to-clipboard"
			>Copy text to clipboard on successful transcription</Label
		>
	</div>
	<div class="flex items-center gap-2">
		<Switch
			id="paste-from-clipboard"
			aria-labelledby="paste-from-clipboard"
			checked={settings.value.isPasteContentsOnSuccessEnabled}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					isPasteContentsOnSuccessEnabled: v,
				};
			}}
		/>
		<Label for="paste-from-clipboard">
			Paste contents from clipboard after successful transcription
		</Label>
	</div>
	<div class="flex items-center gap-2">
		<Switch
			id="faster-rerecord"
			aria-labelledby="faster-rerecord"
			checked={settings.value.isFasterRerecordEnabled}
			onCheckedChange={(v) => {
				settings.value = { ...settings.value, isFasterRerecordEnabled: v };
			}}
		/>
		<Label for="faster-rerecord">
			Enable faster rerecord. <Button
				variant="link"
				size="inline"
				onclick={() => (fasterRerecordExplainedDialog.isOpen = true)}
			>
				(What's that?)
			</Button>
		</Label>
	</div>
	{#if window.__TAURI_INTERNALS__}
		<div class="grid gap-2">
			<SettingsLabelSelect
				id="always-on-top"
				label="Always On Top"
				items={ALWAYS_ON_TOP_OPTIONS}
				selected={settings.value.alwaysOnTop}
				onSelectedChange={async (selected) => {
					if (!selected) return;
					settings.value = { ...settings.value, alwaysOnTop: selected };
					setAlwaysOnTopToTrueIfAlwaysInSettings();
				}}
				placeholder="Select a language"
			/>
		</div>
	{/if}
</div>
