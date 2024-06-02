import redLargeSquare from 'data-base64:~assets/red_large_square.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';
import { sendMessageToContentScript, type MessageToBackgroundRequest } from '~lib/utils/messaging';

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'install') {
		chrome.runtime.openOptionsPage();
	}
});

chrome.commands.onCommand.addListener(async (command) => {
	if (command === 'toggle-recording') {
		const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!activeTabs[0]) return;
		const activeTab = activeTabs[0];
		sendMessageToContentScript(activeTab.id, { action: 'toggle-recording' });
	}
});

chrome.runtime.onMessage.addListener(function (message: MessageToBackgroundRequest) {
	switch (message.action) {
		case 'setIcon':
			const { icon } = message;
			switch (icon) {
				case 'studioMicrophone':
					chrome.action.setIcon({ path: studioMicrophone });
					break;
				case 'redLargeSquare':
					chrome.action.setIcon({ path: redLargeSquare });
					break;
			}
			break;
		case 'openOptionsPage':
			chrome.runtime.openOptionsPage();
			break;
	}
});
