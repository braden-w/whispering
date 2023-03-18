<script>
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import toast from 'svelte-french-toast';

	let inputApiKey = $apiKey;

	function submitApiKey() {
		if (!inputApiKey) {
			toast.error('Please enter your OpenAI API key.');
		} else {
			localStorage.setItem('openai-api-key', inputApiKey);
			apiKey.set(inputApiKey);
			toast.success('API key set!');
			goto('/');
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Enter OpenAI API Key</h1>
	<div class="flex items-center space-x-2">
		<input
			class="w-64 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
			placeholder="API Key"
			bind:value={inputApiKey}
		/>
		<button
			class="px-4 py-2 text-white bg-gray-600 border border-gray-600 rounded-md hover:bg-gray-700 focus:border-gray-700 focus:ring-2 focus:ring-gray-200 focus:outline-none"
			on:click={submitApiKey}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-6 h-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
				/>
			</svg>
		</button>
	</div>
	<p class="text-xs text-gray-600">
		You can find your OpenAI API key in your
		<a
			href="https://beta.openai.com/account/api-keys"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-600 hover:text-indigo-900 underline"
		>
			User Settings
		</a>.
	</p>
</div>
