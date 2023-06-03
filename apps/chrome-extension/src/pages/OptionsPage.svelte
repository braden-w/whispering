<script lang="ts">
	import { onMount } from 'svelte';
	import toast from 'svelte-french-toast/dist/core/toast';
	import { AdjustmentsVerticalIcon, KeyboardIcon, PaperAirplaneIcon } from 'ui/icons';
	import { apiKey } from '~lib/stores/apiKey';
	import { options } from '~lib/stores/options';

	let apiKeyInput: HTMLInputElement;
	let showOptions: boolean;

	const closeWindowAfterMs = (ms: number) => setTimeout(() => window.close(), ms);

	async function submitApiKey() {
		if (!$apiKey) {
			toast.error('Please enter a valid OpenAI API key.');
		} else {
			toast.success('API key set!');
			closeWindowAfterMs(300);
		}
	}

	function openExtensionsShortcutsPage() {
		chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
	}

	apiKey.init();
	options.init();
	onMount(() => {
		apiKeyInput.focus();
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Enter OpenAI API Key</h1>
	<h2 class="text-lg font-light text-gray-500">and grant microphone permission request</h2>
	<form on:submit|preventDefault={submitApiKey}>
		<div class="flex items-center space-x-2">
			<input
				class="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
				placeholder="API Key"
				bind:value={$apiKey}
				bind:this={apiKeyInput}
				type="text"
				autocomplete="off"
				required
			/>
			<button
				class="rounded-md border border-gray-600 bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
				type="submit"
			>
				<PaperAirplaneIcon />
			</button>
		</div>
	</form>
	<p class="text-xs text-gray-500 font-light">
		You can find your OpenAI API key
		<a
			href="https://platform.openai.com/account/api-keys"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-600 underline hover:text-indigo-900"
		>
			here.
		</a>
	</p>

	<div class="flex space-x-2">
		<button
			on:click={() => (showOptions = !showOptions)}
			class="inline-flex items-center space-x-2 rounded-md px-3 py-1 text-gray-700 hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
			type="button"
			aria-label="Show advanced options"
			aria-haspopup="true"
			aria-expanded={showOptions}
		>
			<AdjustmentsVerticalIcon />
			<span>Advanced Options</span>
		</button>
		<button
			on:click={openExtensionsShortcutsPage}
			class="inline-flex items-center space-x-2 rounded-md px-3 py-1 text-gray-700 hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
			type="button"
			aria-label="Edit keyboard shortcut"
		>
			<KeyboardIcon />
			<span>Edit Keyboard Shortcut</span>
		</button>
	</div>

	{#if showOptions}
		<div class="flex flex-col space-y-2 px-4">
			<label class="inline-flex items-center">
				<input type="checkbox" class="text-indigo-600" bind:checked={$options.copyToClipboard} />
				<span class="ml-2 text-gray-600">Copy text to clipboard on successful transcription</span>
			</label>
		</div>
	{/if}
</div>
