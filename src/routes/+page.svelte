<script>
	import { startRecording, stopRecording } from '$lib/recorder';

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
</script>

<div class="flex items-center justify-center min-h-screen">
	<button class="text-6xl focus:outline-none" on:click={toggleRecording}>{micIcon}</button>
</div>
