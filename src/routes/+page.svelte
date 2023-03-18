<script lang="ts">
	import { startRecording, stopRecording } from '$lib/recorder';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-french-toast';

	let isRecording = false;
	let micIcon = '🎙️';
	let outputText = '';
	let apiKey = '';
	async function toggleRecording() {
		if (!apiKey) {
			toast.error('Please enter your OpenAI API key in the settings.', {
				duration: 2000
			});
		}
		isRecording = !isRecording;
		micIcon = isRecording ? '🟥' : '🎙️';

		if (isRecording) {
			await startRecording();
		} else {
			const audioBlob = await stopRecording();
			toast.promise(
				processRecording(audioBlob),
				{
					loading: 'Processing Whisper...',
					success: 'Copied to clipboard!',
					error: 'Something went wrong.'
				},
				{
					duration: 2000
				}
			);
		}
	}

	async function processRecording(audioBlob: Blob) {
		const response = await fetch('/api/whisper', {
			method: 'POST',
			body: audioBlob,
			headers: {
				'content-type': 'audio/wav'
			}
		});
		const text = await response.text();
		navigator.clipboard.writeText(text);
		outputText = text;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code === 'Space') {
			event.preventDefault(); // Prevent scrolling
			toggleRecording();
		}
	}

	function copyOutputText() {
		navigator.clipboard.writeText(outputText);
		toast.success('Copied to clipboard!', { duration: 2000 });
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});
</script>

<div class="flex flex-col items-center justify-center min-h-screen space-y-4">
	<h1 class="text-4xl font-semibold text-gray-700">Whispering</h1>
	{#if !apiKey}
		<div class="flex items-center space-x-2">
			<input
				class="w-64 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
				placeholder="Enter your OpenAI API Key"
				bind:value={outputText}
			/>

			<button
				class="px-4 py-2 text-white bg-gray-600 border border-gray-600 rounded-md hover:bg-gray-700 focus:border-gray-700 focus:ring-2 focus:ring-gray-200 focus:outline-none"
				on:click={copyOutputText}
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
				class="text-gray-600 hover:text-indigo-800 underline"
			>
				User Settings
			</a>.
		</p>
	{:else}
		<button class="text-6xl focus:outline-none" on:click={toggleRecording}>{micIcon}</button>
		<div class="flex items-center space-x-2">
			<input
				class="w-64 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
				placeholder="Output text will appear here..."
				bind:value={outputText}
			/>

			<button
				class="px-4 py-2 text-white bg-gray-600 border border-gray-600 rounded-md hover:bg-gray-700 focus:border-gray-700 focus:ring-2 focus:ring-gray-200 focus:outline-none"
				on:click={copyOutputText}
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
						d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
					/>
				</svg>
			</button>
		</div>
		<p class="text-xs text-gray-600">
			Click the microphone or press the spacebar to start recording.
		</p>
	{/if}

	<div class="fixed bottom-4 right-4">
		<a
			href="https://github.com/braden-w/whisper-desktop"
			target="_blank"
			rel="noopener noreferrer"
			class="text-gray-500 hover:text-gray-800 transition-colors duration-200"
			title="View project on GitHub"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8">
				<path
					d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.6-.015 2.89-.015 3.29 0 .32.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
				/>
			</svg>
		</a>
	</div>
</div>
