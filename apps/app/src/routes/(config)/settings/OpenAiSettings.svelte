<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { settings } from '$lib/stores/settings.svelte';
</script>

<div class="grid gap-2">
	<Label class="text-sm" for="openai-api-key">OpenAI API Key</Label>
	<Input
		id="openai-api-key"
		placeholder="Your OpenAI API Key"
		bind:value={settings.openAiApiKey}
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
