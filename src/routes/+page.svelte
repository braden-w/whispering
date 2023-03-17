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

<div class="flex items-center justify-center min-h-screen">
	<button class="text-6xl focus:outline-none" on:click={toggleRecording}>{micIcon}</button>
</div>
