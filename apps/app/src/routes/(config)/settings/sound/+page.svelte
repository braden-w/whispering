<script lang="ts">
	import { SettingsLabelSwitch } from '$lib/components/labeled-input';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<svelte:head>
	<title>Sound Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Sound</h3>
		<p class="text-muted-foreground text-sm">
			Configure your Whispering sound preferences.
		</p>
	</div>

	<Separator />

	<div class="space-y-4">
		<SettingsLabelSwitch
			id="play-sound-start"
			label="Play sound when recording starts"
			checked={settings.value['sound.playOnStartSuccess']}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					'sound.playOnStartSuccess': v,
				};
			}}
		/>

		<SettingsLabelSwitch
			id="play-sound-stop"
			label="Play sound when recording stops"
			checked={settings.value['sound.playOnStopSuccess']}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					'sound.playOnStopSuccess': v,
				};
			}}
		/>

		<SettingsLabelSwitch
			id="play-sound-cancel"
			label="Play sound when recording cancels"
			checked={settings.value['sound.playOnCancelSuccess']}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					'sound.playOnCancelSuccess': v,
				};
			}}
		/>

		<SettingsLabelSwitch
			id="play-sound-transcription"
			label="Play sound after transcription"
			checked={settings.value['sound.playOnTranscriptionSuccess']}
			onCheckedChange={(v) => {
				settings.value = {
					...settings.value,
					'sound.playOnTranscriptionSuccess': v,
				};
			}}
		/>
	</div>
</div>
