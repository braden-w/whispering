import type { Icon } from '~background/setIcon';
import { writeText } from '~lib/apis/clipboard';
import { startRecording, stopRecording } from '~lib/recorder/mediaRecorder';
import { getApiKey } from '~lib/stores/apiKey';
import { transcribeAudioWithWhisperApi } from '~lib/transcribeAudioWithWhisperApi';
import { sendMessageToBackground } from '~lib/utils/messaging';

export {};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
	const apiKey = await getApiKey();
	if (!apiKey) {
		alert('Please set your API key in the extension options');
		// Open the options page
		openOptionsPage();
		return;
	}

	switch (request.name) {
		case 'startRecording':
			await startRecording();
			switchIcon('octagonalSign');
			break;

		case 'stopRecording':
			const audioBlob = await stopRecording();
			switchIcon('arrowsCounterclockwise');
			const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey);
			writeText(text);
			switchIcon('studioMicrophone');
			sendResponse({ text });
			break;
	}

	return true;
});

function switchIcon(icon: Icon) {
	sendMessageToBackground({ action: 'setIcon', icon });
}

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
