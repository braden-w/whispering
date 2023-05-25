import type { Icon } from '~background/setIcon';

export type Request =
	| {
			action: 'setIcon';
			icon: Icon;
	  }
	| {
			action: 'openOptionsPage';
	  };

/** Sends a message to the background script, captured in {@link ~background/index.ts}. */
export function sendMessageToBackground(request: Request) {
	chrome.runtime.sendMessage(request);
}

/** Sends a message to the content script, captured in {@link ~contents/globalToggleRecording}. */
export async function sendMessageToContentScript(actionName: 'startRecording' | 'stopRecording') {
	const [tab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true
	});
	const response = await chrome.tabs.sendMessage(tab.id, {
		name: actionName
	});
	return response;
}
