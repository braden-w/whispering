import {
	getIsBackgroundRecording,
	toggleIsBackgroundRecording
} from '~lib/stores/isBackgroundRecording';

export async function toggleRecording() {
	let isRecording = await getIsBackgroundRecording();
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
