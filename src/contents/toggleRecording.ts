import { get } from 'svelte/store';
import type { Icon } from '~background/setIcon';
import { writeTextToClipboard } from '~lib/apis/clipboard';
import { startRecording, stopRecording } from '~lib/recorder/mediaRecorder';
import { apiKey } from '~lib/stores/apiKey';
import { isBackgroundRecording } from '~lib/stores/isBackgroundRecording';
import { options } from '~lib/stores/options';
import { transcribeAudioWithWhisperApi } from '~lib/transcribeAudioWithWhisperApi';
import { sendMessageToBackground } from '~lib/utils/messaging';

type ToggleRecordingOptions = {
	switchIcon: (icon: Icon) => void;
	/** Called after text is successfully transcribed and (possibly) copied to clipboard */
	onSuccessfulTranscription: (text: string) => void;
};

export async function toggleRecording({
	switchIcon,
	onSuccessfulTranscription
}: ToggleRecordingOptions): Promise<void> {
	const apiKeyValue = get(apiKey);
	if (!apiKeyValue) {
		alert('Please set your API key in the extension options');
		openOptionsPage();
		return;
	}

	let isRecording = get(isBackgroundRecording);
	if (!isRecording) {
		await startRecording();
		switchIcon('octagonalSign');
	} else {
		try {
			const audioBlob = await stopRecording();
			switchIcon('arrowsCounterclockwise');
			const text = await transcribeAudioWithWhisperApi(audioBlob, apiKeyValue);
			if (get(options).copyToClipboard) writeTextToClipboard(text);
			onSuccessfulTranscription(text);
		} catch (error) {
			console.error('Error occurred during transcription:', error);
		} finally {
			switchIcon('studioMicrophone');
		}
	}
	await isBackgroundRecording.toggle();
}

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
