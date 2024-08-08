<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { settings } from '$lib/stores/settings.svelte';
	import SettingsLabelInput from '../SettingsLabelInput.svelte';
</script>

<svelte:head>
	<title>Configure Shortcuts - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Shortcuts</h3>
		<p class="text-muted-foreground text-sm">Configure your shortcuts for activating Whispering.</p>
	</div>
	<Separator />
	<div class="grid gap-2">
		<SettingsLabelInput
			id="local-shortcut"
			label="Local Shortcut"
			placeholder="Local Shortcut to toggle recording"
			bind:value={settings.currentLocalShortcut}
		/>
	</div>
	<div class="grid gap-2">
		{#if window.__TAURI__}
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
</div>
