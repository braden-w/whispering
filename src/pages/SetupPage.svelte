<script lang="ts">
	import toast from 'svelte-french-toast/dist/core/toast';

	import Anchor from '~lib/Anchor.svelte';
	import { apiKey } from '~lib/stores/apiKey';
	import { goto } from '~lib/stores/currentRoute';

	let inputApiKey: string = $apiKey;

	async function submitApiKey() {
		if (!inputApiKey) {
			toast.error('Please enter a valid OpenAI API key.');
		} else {
			$apiKey = inputApiKey;
			toast.success('API key set!');
			goto('/');
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Enter OpenAI API Key</h1>
	<form on:submit|preventDefault={submitApiKey}>
		<div class="flex items-center space-x-2">
			<input
				class="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
				placeholder="API Key"
				bind:value={inputApiKey}
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
		You can find your OpenAI API key in your
		<a
			href="https://beta.openai.com/account/api-keys"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-600 underline hover:text-indigo-900">
			User Settings.
		</a>
	</p>
	<p class="text-xs text-gray-600">
		<Anchor href="/" class="text-gray-600 underline hover:text-indigo-900">Go back</Anchor>
	</p>
</div>
