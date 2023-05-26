import type { Icon } from '~background/setIcon';
import {
	pasteFromClipboard,
	writeTextToClipboard,
	writeToCursor as writeTextToCursor
} from '~lib/apis/clipboard';
import { startRecording, stopRecording } from '~lib/recorder/mediaRecorder';
import { getApiKey } from '~lib/stores/apiKey';
import { transcribeAudioWithWhisperApi } from '~lib/transcribeAudioWithWhisperApi';
import { type MessageToContentScriptRequest, sendMessageToBackground } from '~lib/utils/messaging';

chrome.runtime.onMessage.addListener(async function (message: MessageToContentScriptRequest) {
	const apiKey = await getApiKey();
	if (!apiKey) {
		alert('Please set your API key in the extension options');
		openOptionsPage();
		return;
	}

	switch (message.name) {
		case 'startRecording':
			await startRecording();
			switchIcon('octagonalSign');
			break;

		case 'stopRecording':
			try {
				const audioBlob = await stopRecording();
				switchIcon('arrowsCounterclockwise');
				const text = await transcribeAudioWithWhisperApi(audioBlob, apiKey);
				writeTextToClipboard(text);
				writeTextToCursor(text);
			} catch (error) {
				console.error('Error occurred during transcription:', error);
			} finally {
				switchIcon('studioMicrophone');
			}
			break;
	}
});

function switchIcon(icon: Icon) {
	sendMessageToBackground({ action: 'setIcon', icon });
}

function openOptionsPage() {
	sendMessageToBackground({ action: 'openOptionsPage' });
}
