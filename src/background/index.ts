import type { MessageToBackgroundRequest } from '~lib/utils/messaging';

import { setIcon } from './setIcon';
import { toggleRecording } from './toggleRecording';

export {};

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'install') {
		chrome.runtime.openOptionsPage();
	}
});

chrome.commands.onCommand.addListener(async function (command) {
	if (command === 'toggle-recording') {
		await toggleRecording();
	}
});

chrome.runtime.onMessage.addListener(function (message: MessageToBackgroundRequest) {
	switch (message.action) {
		case 'setIcon':
			setIcon(message.icon);
			break;
		case 'openOptionsPage':
			chrome.runtime.openOptionsPage();
			break;
	}
});
