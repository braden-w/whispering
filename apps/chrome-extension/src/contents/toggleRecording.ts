import {get} from 'svelte/store';
import type {Icon} from '~background/setIcon';
import {writeTextToClipboard} from '~lib/apis/clipboard';
import {startRecording, stopRecording} from '~lib/recorder/mediaRecorder';
import {apiKey, audioSrc, outputText} from '~lib/stores/apiKey';
import {options} from '~lib/stores/options';
import {recordingState} from '~lib/stores/recordingState';
import {transcribeAudioWithWhisperApi} from '~lib/transcribeAudioWithWhisperApi';
import {sendMessageToBackground} from '~lib/utils/messaging';

type ToggleRecordingOptions = {
	switchIcon: (icon: Icon) => void;
	/** Called after text is successfully transcribed and (possibly) copied to clipboard */
	onSuccessfulTranscription: (text: string) => void;
};

export async function toggleRecording({
	switchIcon,
	onSuccessfulTranscription
}: ToggleRecordingOptions): Promise<void> {
	await apiKey.init();
	const apiKeyValue = get(apiKey);
	if (!apiKeyValue) {
		alert('Please set your API key in the extension options');
		openOptionsPage();
		return;
	}

	if (get(recordingState) === 'idle') {
		console.log('🚀 ~ file: toggleRecording.ts:30 ~ get(recordingState):', get(recordingState));
		await startRecording();
		switchIcon('octagonalSign');
		await recordingState.set('recording');
	} else {
		try {
			const audioBlob = await stopRecording();
			audioSrc.set(URL.createObjectURL(audioBlob));
			switchIcon('arrowsCounterclockwise');
			await recordingState.set('transcribing');
			const text = await transcribeAudioWithWhisperApi(audioBlob, apiKeyValue);
			writeTextToClipboardIfEnabled(text);
			outputText.set(text);
			onSuccessfulTranscription(text);
		} catch (error) {
			console.error('Error occurred during transcription:', error);
		} finally {
			switchIcon('studioMicrophone');
			await recordingState.set('idle');
		}
	}
}

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}

async function writeTextToClipboardIfEnabled(text: string) {
	await options.init();
	const { copyToClipboard } = get(options);
	if (!copyToClipboard) return;
	writeTextToClipboard(text);
}
