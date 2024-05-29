import { recorder } from '$lib/stores';
import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	exclude_matches: ['https://chat.openai.com/*'],
};

chrome.runtime.onMessage.addListener(async function (message: MessageToContentScriptRequest) {
	if (message.command === 'toggle-recording') recorder.toggleRecording();
});
