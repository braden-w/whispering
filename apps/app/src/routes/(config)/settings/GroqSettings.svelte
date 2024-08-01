<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<div class="grid gap-2">
	<Label class="text-sm" for="groq-api-key">Groq API Key</Label>
	<Input
		id="groq-api-key"
		placeholder="Your Groq API Key"
		bind:value={settings.groqApiKey}
		type="password"
		autocomplete="off"
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
