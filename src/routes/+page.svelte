<script lang="ts">
	import { startRecording, stopRecording } from '$lib/recorder';
	import { onDestroy, onMount } from 'svelte';

	let isRecording = false;
	let micIcon = '🎙️';

	async function toggleRecording() {
		isRecording = !isRecording;
		micIcon = isRecording ? '🟥' : '🎙️';

		if (isRecording) {
			await startRecording();
		} else {
			const audioBlob = await stopRecording();
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
	<button class="text-6xl focus:outline-none" on:click={toggleRecording}>{micIcon}</button>
	<input
		class="w-64 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
		type="text"
		placeholder="Enter your text"
	/>
</div>
