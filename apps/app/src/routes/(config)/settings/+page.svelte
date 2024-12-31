<script lang="ts">
	import { fasterRerecordExplainedDialog } from '$lib/components/FasterRerecordExplainedDialog.svelte';
	import { macOSAppNapExplainedDialog } from '$lib/components/MacOSAppNapExplainedDialog.svelte';
	import MacOSAppNapExplainedDialog from '$lib/components/MacOSAppNapExplainedDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { settings } from '$lib/stores/settings.svelte';
	import { ALWAYS_ON_TOP_OPTIONS } from '@repo/shared';
	import SettingsLabelSelect from './SettingsLabelSelect.svelte';
	import { type } from '@tauri-apps/plugin-os';
	import * as Card from '$lib/components/ui/card';
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

	<div class="space-y-2">
		<Label class="text-sm">Sound Settings</Label>
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<Switch
					id="play-sound-start"
					aria-labelledby="play-sound-start"
					checked={settings.value['sound.playOnStartSuccess']}
					onCheckedChange={(v) => {
						settings.value = {
							...settings.value,
							'sound.playOnStartSuccess': v,
						};
					}}
				/>
				<Label for="play-sound-start">Play sound when recording starts</Label>
			</div>
			<div class="flex items-center gap-2">
				<Switch
					id="play-sound-stop"
					aria-labelledby="play-sound-stop"
					checked={settings.value['sound.playOnStopSuccess']}
					onCheckedChange={(v) => {
						settings.value = {
							...settings.value,
							'sound.playOnStopSuccess': v,
						};
					}}
				/>
				<Label for="play-sound-stop">Play sound when recording stops</Label>
			</div>
			<div class="flex items-center gap-2">
				<Switch
					id="play-sound-cancel"
					aria-labelledby="play-sound-cancel"
					checked={settings.value['sound.playOnCancelSuccess']}
					onCheckedChange={(v) => {
						settings.value = {
							...settings.value,
							'sound.playOnCancelSuccess': v,
						};
					}}
				/>
				<Label for="play-sound-cancel">Play sound when recording cancels</Label>
			</div>
			<div class="flex items-center gap-2">
				<Switch
					id="play-sound-transcription"
					aria-labelledby="play-sound-transcription"
					checked={settings.value['sound.playOnTranscriptionSuccess']}
					onCheckedChange={(v) => {
						settings.value = {
							...settings.value,
							'sound.playOnTranscriptionSuccess': v,
						};
					}}
				/>
				<Label for="play-sound-transcription">
					Play sound after transcription
				</Label>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-2">
		<Switch
			id="copy-to-clipboard"
			aria-labelledby="copy-to-clipboard"
			checked={settings.value['transcription.clipboard.copyOnSuccess']}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					'transcription.clipboard.copyOnSuccess': v,
				};
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
			checked={settings.value['transcription.clipboard.pasteOnSuccess']}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					'transcription.clipboard.pasteOnSuccess': v,
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
			checked={settings.value['recording.isFasterRerecordEnabled']}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					'recording.isFasterRerecordEnabled': v,
				};
			}}
		/>
		<Label for="faster-rerecord">
			Enable faster rerecord. <Button
				variant="link"
				size="inline"
				onclick={() => fasterRerecordExplainedDialog.open()}
			>
				(What's that?)
			</Button>
		</Label>
	</div>

	{#if window.__TAURI_INTERNALS__}
		<div class="flex items-center gap-2">
			<Switch
				id="close-to-tray"
				aria-labelledby="close-to-tray"
				checked={settings.value['system.closeToTray']}
				onCheckedChange={(v) => {
					settings.value = { ...settings.value, 'system.closeToTray': v };
				}}
			/>
			<Label for="close-to-tray">
				Close to tray instead of quitting
				{#if window.__TAURI_INTERNALS__ && type() === 'macos'}
					<Button
						variant="link"
						size="inline"
						onclick={() => macOSAppNapExplainedDialog.open()}
					>
						(Not recommended for macOS)
					</Button>
				{/if}
			</Label>
		</div>
	{/if}

	<Separator />

	<div class="grid gap-2">
		<SettingsLabelSelect
			id="recording-retention-strategy"
			label="Auto Delete Recordings"
			items={[
				{ value: 'keep-forever', label: 'Keep All Recordings' },
				{ value: 'limit-count', label: 'Keep Limited Number' },
			]}
			selected={settings.value['database.recordingRetentionStrategy']}
			onSelectedChange={(selected) => {
				if (!selected) return;
				settings.value = {
					...settings.value,
					'database.recordingRetentionStrategy': selected,
				};
			}}
			placeholder="Select retention strategy"
		/>
	</div>

	{#if settings.value['database.recordingRetentionStrategy'] === 'limit-count'}
		<div class="grid gap-2">
			<SettingsLabelSelect
				id="max-recording-count"
				label="Maximum Recordings"
				items={[
					{ value: '5', label: '5 Recordings' },
					{ value: '10', label: '10 Recordings' },
					{ value: '25', label: '25 Recordings' },
					{ value: '50', label: '50 Recordings' },
					{ value: '100', label: '100 Recordings' },
				]}
				selected={settings.value['database.maxRecordingCount']}
				onSelectedChange={(selected) => {
					if (!selected) return;
					settings.value = {
						...settings.value,
						'database.maxRecordingCount': selected,
					};
				}}
				placeholder="Select maximum recordings"
			/>
		</div>
	{/if}

	{#if window.__TAURI_INTERNALS__}
		<div class="grid gap-2">
			<SettingsLabelSelect
				id="always-on-top"
				label="Always On Top"
				items={ALWAYS_ON_TOP_OPTIONS}
				selected={settings.value['system.alwaysOnTop']}
				onSelectedChange={async (selected) => {
					if (!selected) return;
					settings.value = {
						...settings.value,
						'system.alwaysOnTop': selected,
					};
				}}
				placeholder="Select a language"
			/>
		</div>
	{/if}
</div>

<MacOSAppNapExplainedDialog />
