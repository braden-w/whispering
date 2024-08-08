<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Switch } from '$lib/components/ui/switch';
	import { settings } from '$lib/stores/settings.svelte';
	import { refreshAlwaysOnTopFromSettings } from '$lib/services/AlwaysOnTopService';
	import { ALWAYS_ON_TOP_OPTIONS } from '@repo/shared';
	import SettingsLabelSelect from './SettingsLabelSelect.svelte';

	const selectedAlwaysOnTopOption = $derived(
		ALWAYS_ON_TOP_OPTIONS.find((option) => option.value === settings.value.alwaysOnTop),
	);
</script>

<svelte:head>
	<title>Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">General</h3>
		<p class="text-muted-foreground text-sm">Configure your general Whispering preferences.</p>
	</div>
	<Separator />
	<div class="flex items-center gap-2">
		<Switch
			id="play-sound-enabled"
			aria-labelledby="play-sound-enabled"
			bind:checked={settings.value.isPlaySoundEnabled}
		/>
		<Label for="play-sound-enabled">Play sound on toggle on and off</Label>
	</div>
	<div class="flex items-center gap-2">
		<Switch
			id="copy-to-clipboard"
			aria-labelledby="copy-to-clipboard"
			bind:checked={settings.value.isCopyToClipboardEnabled}
		/>
		<Label for="copy-to-clipboard">Copy text to clipboard on successful transcription</Label>
	</div>
	<div class="flex items-center gap-2">
		<Switch
			id="paste-from-clipboard"
			aria-labelledby="paste-from-clipboard"
			bind:checked={settings.value.isPasteContentsOnSuccessEnabled}
		/>
		<Label for="paste-from-clipboard">
			Paste contents from clipboard after successful transcription
		</Label>
	</div>
	{#if window.__TAURI__}
		<div class="grid gap-2">
			<SettingsLabelSelect
				id="always-on-top"
				label="Always On Top"
				items={ALWAYS_ON_TOP_OPTIONS}
				selected={selectedAlwaysOnTopOption}
				onSelectedChange={async (selected) => {
					if (!selected) return;
					settings.value.alwaysOnTop = selected.value;
					refreshAlwaysOnTopFromSettings();
				}}
				placeholder="Select a language"
			/>
		</div>
	{/if}
</div>
