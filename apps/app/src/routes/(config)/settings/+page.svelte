<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Switch } from '$lib/components/ui/switch';
	import { settings } from '$lib/stores/settings.svelte';
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
</div>
