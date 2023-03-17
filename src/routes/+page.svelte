<script>
	import { writeText } from '@tauri-apps/api/clipboard';
	import { startRecording, stopRecording } from '$lib/recorder';
	import { sendAudioToWhisper } from '$lib/whisper';

	let isRecording = false;
	let micIcon = '🎙️';

	async function toggleRecording() {
		isRecording = !isRecording;
		micIcon = isRecording ? '🟥' : '🎙️';

		if (isRecording) {
			await startRecording();
		} else {
			await writeText('Tauri is awesome!');
			const audioBlob = await stopRecording();
			const text = await sendAudioToWhisper(audioBlob);
		}
	}
</script>

<div class="flex items-center justify-center min-h-screen">
	<button class="text-6xl focus:outline-none" on:click={toggleRecording}>{micIcon}</button>
</div>
