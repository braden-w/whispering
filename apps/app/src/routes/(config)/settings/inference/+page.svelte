<script lang="ts">
	import AnthropicApiKeyInput from './-components/AnthropicApiKeyInput.svelte';
	import GroqApiKeyInput from './-components/GroqApiKeyInput.svelte';
	import OpenAiApiKeyInput from './-components/OpenAiApiKeyInput.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
</script>

<svelte:head>
	<title>Inference Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Inference</h3>
		<p class="text-muted-foreground text-sm">
			Configure your Whispering inference preferences.
		</p>
	</div>
	<Separator />

	<OpenAiApiKeyInput />
	<AnthropicApiKeyInput />
	<GroqApiKeyInput />
</div>
