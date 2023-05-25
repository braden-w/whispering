import arrowsCounterclockwise from 'data-base64:~assets/arrows_counterclockwise.png';
import octagonalSign from 'data-base64:~assets/octagonal_sign.png';
import studioMicrophone from 'data-base64:~assets/studio_microphone.png';

import {
	getIsBackgroundRecording,
	toggleIsBackgroundRecording
} from '~lib/stores/isBackgroundRecording';

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
	if (request.icon === 'studioMicrophone') {
		chrome.action.setIcon({ path: studioMicrophone });
	} else if (request.icon === 'octagonalSign') {
		chrome.action.setIcon({ path: octagonalSign });
	} else if (request.icon === 'arrowsCounterclockwise') {
		chrome.action.setIcon({ path: arrowsCounterclockwise });
	}
});

async function toggleRecording() {
	let isRecording = await getIsBackgroundRecording();
	console.log('🚀 ~ file: background.ts:19 ~ toggleRecording ~ isRecording:', isRecording);
	if (!isRecording) {
		const response = await sendActionToContentScript('startRecording');
		await toggleIsBackgroundRecording();
	} else {
		const response = await sendActionToContentScript('stopRecording');
		console.log('🚀 ~ file: background.ts:32 ~ toggleRecording ~ response:', response);
		await toggleIsBackgroundRecording();
	}
}

async function sendActionToContentScript(actionName: 'startRecording' | 'stopRecording') {
	const [tab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true
	});
	const response = await chrome.tabs.sendMessage(tab.id, {
		name: actionName
	});
	return response;
}
