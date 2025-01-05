<script lang="ts">
	import CopyableCode from '$lib/components/CopyableCode.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { settings } from '$lib/stores/settings.svelte';
	import {
		GROQ_MODELS_OPTIONS,
		SUPPORTED_LANGUAGES_OPTIONS,
		TRANSCRIPTION_SERVICE_OPTIONS,
		WHISPERING_URL,
	} from '@repo/shared';
	import {
		LabeledInput,
		LabeledSelect,
		LabeledSwitch,
		LabeledTextarea,
	} from '$lib/components/labeled/index.js';
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

	<LabeledInput
		id="openai-api-key"
		label="OpenAI API Key"
		type="password"
		placeholder="Your OpenAI API Key"
		value={settings.value['inference.openAi.apiKey']}
		oninput={({ currentTarget: { value } }) => {
			settings.value = {
				...settings.value,
				'inference.openAi.apiKey': value,
			};
		}}
		description="Your OpenAI API Key"
	/>

	<LabeledInput
		id="anthropic-api-key"
		label="Anthropic API Key"
		type="password"
		placeholder="Your Anthropic API Key"
		value={settings.value['inference.anthropic.apiKey']}
		oninput={({ currentTarget: { value } }) => {
			settings.value = {
				...settings.value,
				'inference.anthropic.apiKey': value,
			};
		}}
		description="Your Anthropic API Key"
	/>

	<LabeledInput
		id="groq-api-key"
		label="Groq API Key"
		type="password"
		placeholder="Your Groq API Key"
		value={settings.value['inference.groq.apiKey']}
		description="Your Groq API Key"
	/>
</div>
