import { type Icon, setIcon } from './setIcon';
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

type Request =
	| {
			action: 'setIcon';
			icon: Icon;
	  }
	| {
			action: 'openOptionsPage';
	  };
chrome.runtime.onMessage.addListener(function (request: Request, sender, sendResponse) {
	switch (request.action) {
		case 'setIcon':
			setIcon(request.icon);
			break;
		case 'openOptionsPage':
			chrome.runtime.openOptionsPage();
			break;
	}
});
