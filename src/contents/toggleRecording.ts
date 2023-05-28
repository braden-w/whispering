import { get } from 'svelte/store';

import type { Icon } from '~background/setIcon';
import { startRecording, stopRecording } from '~lib/recorder/mediaRecorder';
import { apiKey } from '~lib/stores/apiKey';
import {
	getIsBackgroundRecording,
	toggleIsBackgroundRecording
} from '~lib/stores/isBackgroundRecording';
import { transcribeAudioWithWhisperApi } from '~lib/transcribeAudioWithWhisperApi';
import { sendMessageToBackground } from '~lib/utils/messaging';

export async function toggleRecording({
	switchIcon,
	onSuccess
}: {
	switchIcon: (icon: Icon) => void;
	onSuccess: (text: string) => void;
}) {
	const apiKeyValue = get(apiKey);
	if (!apiKeyValue) {
		alert('Please set your API key in the extension options');
		openOptionsPage();
		return;
	}

	let isRecording = await getIsBackgroundRecording();
	if (!isRecording) {
		await startRecording();
		switchIcon('octagonalSign');
	} else {
		try {
			const audioBlob = await stopRecording();
			switchIcon('arrowsCounterclockwise');
			const text = await transcribeAudioWithWhisperApi(audioBlob, apiKeyValue);
			onSuccess(text);
		} catch (error) {
			console.error('Error occurred during transcription:', error);
		} finally {
			switchIcon('studioMicrophone');
		}
	}
	await toggleIsBackgroundRecording();
}

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
