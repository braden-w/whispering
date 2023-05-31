import { apiKey } from '$lib/stores/apiKey';
import { audioSrc, isRecording, outputText } from '$lib/stores/isRecording';
import { writeTextToClipboard } from '$lib/system-apis/clipboard';
import { setAlwaysOnTop } from '$lib/system-apis/window';
import PleaseEnterAPIKeyToast from '$lib/toasts/PleaseEnterAPIKeyToast.svelte';
import SomethingWentWrongToast from '$lib/toasts/SomethingWentWrongToast.svelte';
import { transcribeAudioWithWhisperApi } from '$lib/transcribeAudioWithWhisperApi';
import toast from 'svelte-french-toast';
import { get } from 'svelte/store';
import { startRecording, stopRecording } from './mediaRecorder';

export async function toggleRecording() {
	const apiKeyValue = get(apiKey);
	if (!apiKeyValue) {
		toast.error(PleaseEnterAPIKeyToast);
		return;
	}

	const isRecordingValue = get(isRecording);
	if (!isRecordingValue) {
		await setAlwaysOnTop(true);
		await startRecording();
	} else {
		try {
			const audioBlob = await stopRecording();
			audioSrc.set(URL.createObjectURL(audioBlob));
			toast.promise(processRecording(audioBlob), {
				loading: 'Processing Whisper...',
				success: 'Copied to clipboard!',
				error: () => SomethingWentWrongToast
			});
		} catch (error) {
			console.error('Error occurred during transcription:', error);
		} finally {
			await setAlwaysOnTop(false);
		}
	}
	await isRecording.toggle();
}

async function processRecording(audioBlob: Blob) {
	const text = await transcribeAudioWithWhisperApi(audioBlob, get(apiKey));
	writeTextToClipboard(text);
	outputText.set(text);
}
