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

chrome.runtime.onMessage.addListener(function (
	request: { icon: 'studioMicrophone' | 'octagonalSign' | 'arrowsCounterclockwise' },
	sender,
	sendResponse
) {
	setIcon(request.icon);
});
