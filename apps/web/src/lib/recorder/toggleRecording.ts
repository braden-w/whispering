import { apiKey } from '$lib/stores/apiKey';
import { recorder } from '$lib/stores/recordingState';
import { pasteTextFromClipboard, writeTextToClipboard } from '$lib/system-apis/clipboard';
import { setAlwaysOnTop } from '$lib/system-apis/window';
import PleaseEnterAPIKeyToast from '$lib/toasts/PleaseEnterAPIKeyToast.svelte';
import SomethingWentWrongToast from '$lib/toasts/SomethingWentWrongToast.svelte';
import { transcribeAudioWithWhisperApi } from '$lib/transcribeAudioWithWhisperApi';
import { toast } from '@repo/ui/components/sonner';
import { get } from 'svelte/store';

export async function toggleRecording() {
	const apiKeyValue = get(apiKey);
	if (!apiKeyValue) {
		toast.error(PleaseEnterAPIKeyToast);
		return;
	}

	const recordingStateValue = get(recorder);
	if (recordingStateValue === 'IDLE') {
		await setAlwaysOnTop(true);
		await startRecording();
		recorder.set('RECORDING');
	} else {
		try {
			const audioBlob = await stopRecording();
			// audioSrc.set(URL.createObjectURL(audioBlob));
			recorder.set('TRANSCRIBING');
			await toast.promise(processRecording(audioBlob), {
				loading: 'Processing Whisper...',
				success: 'Copied to clipboard!',
				error: () => SomethingWentWrongToast
			});
		} catch (error) {
			console.error('Error occurred during transcription:', error);
		} finally {
			await setAlwaysOnTop(false);
			recorder.set('IDLE');
		}
	}
}

async function processRecording(audioBlob: Blob) {
	const text = await transcribeAudioWithWhisperApi(audioBlob, get(apiKey));
	// outputText.set(text);
	await writeTextToClipboard(text);
	await pasteTextFromClipboard();
}
