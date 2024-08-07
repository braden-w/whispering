<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { settings } from '$lib/stores/settings.svelte';
	import { SUPPORTED_LANGUAGES_OPTIONS, TRANSCRIPTION_SERVICE_OPTIONS } from '@repo/shared';
	import SettingsLabelInput from '../SettingsLabelInput.svelte';
	import SettingsLabelSelect from '../SettingsLabelSelect.svelte';

	const selectedLanguageOption = $derived(
		SUPPORTED_LANGUAGES_OPTIONS.find((option) => option.value === settings.value.outputLanguage),
	);

	const selectedTranscriptionServiceOption = $derived(
		TRANSCRIPTION_SERVICE_OPTIONS.find(
			(option) => option.value === settings.value.selectedTranscriptionService,
		),
	);
</script>

<svelte:head>
	<title>Transcription Settings - Whispering</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Transcription</h3>
		<p class="text-muted-foreground text-sm">
			Configure your Whispering transcription preferences.
		</p>
	</div>
	<Separator />

	<div class="grid gap-2">
		<SettingsLabelSelect
			id="selected-transcription-service"
			label="Transcription Service"
			items={TRANSCRIPTION_SERVICE_OPTIONS}
			selected={selectedTranscriptionServiceOption}
			onSelectedChange={(selected) => {
				if (!selected) return;
				settings.value = { ...settings.value, selectedTranscriptionService: selected.value };
			}}
			placeholder="Select a transcription service"
		/>
	</div>
	{#if settings.value.selectedTranscriptionService === 'OpenAI'}
		<div class="grid gap-2">
			<SettingsLabelInput
				id="openai-api-key"
				label="OpenAI API Key"
				placeholder="Your OpenAI API Key"
				value={settings.value.openAiApiKey}
				oninput={({ currentTarget: { value } }) => {
					settings.value = { ...settings.value, openAiApiKey: value };
				}}
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
	{:else if settings.value.selectedTranscriptionService === 'Groq'}
		<div class="grid gap-2">
			<SettingsLabelInput
				id="groq-api-key"
				label="Groq API Key"
				placeholder="Your Groq API Key"
				value={settings.value.groqApiKey}
				oninput={({ currentTarget: { value } }) => {
					settings.value = { ...settings.value, groqApiKey: value };
				}}
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
	{/if}
	<div class="grid gap-2">
		<SettingsLabelSelect
			id="output-language"
			label="Output Language"
			items={SUPPORTED_LANGUAGES_OPTIONS}
			selected={selectedLanguageOption}
			onSelectedChange={(selected) => {
				if (!selected) return;
				settings.value = { ...settings.value, outputLanguage: selected.value };
			}}
			placeholder="Select a language"
		/>
	</div>
</div>
