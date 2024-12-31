<script lang="ts">
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
