<script lang="ts">
	import { startRecording, stopRecording } from '$lib/recorder';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-french-toast';

	let isRecording = false;
	let micIcon = '🎙️';
	let clientAPIKey = '';

	async function toggleRecording() {
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
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.code === 'Space') {
			event.preventDefault(); // Prevent scrolling
			toggleRecording();
		}
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
	<button class="text-6xl focus:outline-none" on:click={toggleRecording}>{micIcon}</button>
	<input
		class="w-64 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
		type="text"
		placeholder="Enter OpenAI API Key"
		bind:value={clientAPIKey}
	/>
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
