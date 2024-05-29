import { toggleRecording } from './toggleRecording';
import type { PlasmoCSConfig } from 'plasmo';
import type { Icon } from '$background/setIcon';
import { writeTextToCursor } from '$lib/apis/clipboard';
import { sendMessageToBackground, type MessageToContentScriptRequest } from '$lib/utils/messaging';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	exclude_matches: ['https://chat.openai.com/*'],
};

chrome.runtime.onMessage.addListener(async function (message: MessageToContentScriptRequest) {
	if (message.command === 'toggle-recording')
		await toggleRecording({
			switchIcon: (icon: Icon) => sendMessageToBackground({ action: 'setExtensionIcon', icon }),
			onSuccessfulTranscription: (text: string) => writeTextToCursor(text),
		});
});
