<script lang="ts">
	import { onMount } from 'svelte';
	import toast from 'svelte-french-toast/dist/core/toast';

	import { apiKey } from '~lib/stores/apiKey';
	import { options } from '~lib/stores/options';

	let apiKeyInput: HTMLInputElement;
	let showOptions: boolean;

	async function submitApiKey() {
		if (!$apiKey) {
			toast.error('Please enter a valid OpenAI API key.');
		} else {
			toast.success('API key set!');
			// Close the window after 1 second
			setTimeout(() => window.close(), 300);
		}
	}
	onMount(() => {
		apiKey.init();
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
				required />
			<button
				class="rounded-md border border-gray-600 bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
				type="submit">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="h-6 w-6">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
				</svg>
			</button>
		</div>
	</form>
	<p class="text-xs text-gray-600">
		You can find your OpenAI API key
		<a
			href="https://platform.openai.com/account/api-keys"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-600 underline hover:text-indigo-900">
			here.
		</a>
	</p>

	<button
		on:click={() => (showOptions = !showOptions)}
		class="inline-flex items-center space-x-2 rounded-md border px-3 py-1 text-gray-600 hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
		type="button"
		aria-haspopup="true"
		aria-expanded={showOptions}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			class="h-6 w-6"
			aria-hidden="true">
			<path
				d="M6 12a.75.75 0 01-.75-.75v-7.5a.75.75 0 111.5 0v7.5A.75.75 0 016 12zM18 12a.75.75 0 01-.75-.75v-7.5a.75.75 0 011.5 0v7.5A.75.75 0 0118 12zM6.75 20.25v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM18.75 18.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 011.5 0zM12.75 5.25v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM12 21a.75.75 0 01-.75-.75v-7.5a.75.75 0 011.5 0v7.5A.75.75 0 0112 21zM3.75 15a2.25 2.25 0 104.5 0 2.25 2.25 0 00-4.5 0zM12 11.25a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5zM15.75 15a2.25 2.25 0 104.5 0 2.25 2.25 0 00-4.5 0z" />
		</svg>
		<span>Advanced</span>
	</button>

	{#await options.init() then}
		{#if showOptions}
			<div class="flex flex-col space-y-2 px-4">
				<label class="inline-flex items-center">
					<input type="checkbox" class="text-indigo-600" bind:checked={$options.copyToClipboard} />
					<span class="ml-2 text-gray-600">Copy text to clipboard on successful transcription</span>
				</label>
			</div>
		{/if}
	{/await}
</div>
