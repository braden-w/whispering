import type { Request } from '~background/index';
import type { Icon } from '~background/setIcon';
import { writeText } from '~lib/apis/clipboard';
import { startRecording, stopRecording } from '~lib/recorder/mediaRecorder';
import { getApiKey } from '~lib/stores/apiKey';
import { transcribeAudioWithWhisperApi } from '~lib/transcribeAudioWithWhisperApi';

export {};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
	const apiKey = await getApiKey();
	if (!apiKey) {
		alert('Please set your API key in the extension options');
		// Open the options page
		openOptionsPage();
		return;
	}

	if (request.name === 'startRecording') {
		await startRecording();
		switchIcon('octagonalSign');
	} else if (request.name === 'stopRecording') {
		const audioBlob = await stopRecording();
		switchIcon('arrowsCounterclockwise');
		const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey);
		writeText(text);
		switchIcon('studioMicrophone');
		sendResponse({ text });
	}
	return true;
});

function switchIcon(icon: Icon) {
	sendMessage({ action: 'setIcon', icon });
}

function openOptionsPage() {
	sendMessage({ action: 'openOptionsPage' });
}

function sendMessage(request: Request) {
	chrome.runtime.sendMessage(request);
}
