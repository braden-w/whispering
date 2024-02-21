<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import { onMount } from 'svelte';
	import toast from 'svelte-french-toast';
	import { PaperAirplaneIcon } from 'ui/icons';

	let apiKeyInput: HTMLInputElement;

	function submitApiKey() {
		if (!$apiKey) {
			toast.error('Please enter a valid OpenAI API key.');
		} else {
			toast.success('API key set!');
			goto('/');
		}
	}

	onMount(() => {
		apiKeyInput.focus();
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Enter OpenAI API Key</h1>
	<h2 class="text-lg text-gray-500 font-light">
		You can find your OpenAI API key
		<a
			href="https://platform.openai.com/account/api-keys"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-600 underline hover:text-indigo-900"
		>
			here.
		</a>
	</h2>
	<form on:submit|preventDefault={submitApiKey}>
		<div class="flex items-center space-x-2">
			<input
				class="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
				placeholder="Your OpenAI API Key"
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

	<p class="text-xs text-gray-600">
		<a href="/" class="text-gray-600 underline hover:text-indigo-900"> Go back </a>
	</p>
</div>
