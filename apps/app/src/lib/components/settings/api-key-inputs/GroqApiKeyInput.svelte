<script lang="ts">
	import { LabeledInput } from '$lib/components/labeled/index.js';
	import { Button } from '@repo/ui/button';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<LabeledInput
	id="groq-api-key"
	label="Groq API Key"
	type="password"
	placeholder="Your Groq API Key"
	value={settings.value['apiKeys.groq']}
	oninput={({ currentTarget: { value } }) => {
		settings.value = { ...settings.value, 'apiKeys.groq': value };
	}}
>
	{#snippet description()}
		<p class="text-muted-foreground text-sm">
			You can find your Groq API key in your <Button
				variant="link"
				class="px-0.3 py-0.2 h-fit"
				href="https://console.groq.com/keys"
				target="_blank"
				rel="noopener noreferrer"
			>
				Groq console
			</Button>.
		</p>
	{/snippet}
</LabeledInput>
