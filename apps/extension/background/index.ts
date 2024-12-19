import { toggleRecording } from '~background/messages/whispering-web/toggleRecording';
import { renderErrorAsNotification } from '~lib/errors';

chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === 'install') await chrome.runtime.openOptionsPage();
});

chrome.commands.onCommand.addListener(async (command) => {
	console.info('Received command via Chrome Keyboard Shortcut', command);
	if (command !== 'toggleRecording') return;
	const toggleRecordingResult = await toggleRecording();
	if (!toggleRecordingResult.ok)
		return renderErrorAsNotification(toggleRecordingResult);
});
