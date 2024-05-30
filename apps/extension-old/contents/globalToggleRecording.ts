import { recorder } from '$lib/stores';
import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import type { PlasmoCSConfig } from 'plasmo';
import { CHATGPT_DOMAINS } from './chatGptButton';

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
	exclude_matches: CHATGPT_DOMAINS,
};

chrome.runtime.onMessage.addListener(function (message: MessageToContentScriptRequest) {
	if (message.command === 'toggle-recording') recorder.toggleRecording();
});
