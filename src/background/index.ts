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

chrome.runtime.onMessage.addListener(function (request: MessageToBackgroundRequest) {
	switch (request.action) {
		case 'setIcon':
			setIcon(request.icon);
			break;
		case 'openOptionsPage':
			chrome.runtime.openOptionsPage();
			break;
	}
});
