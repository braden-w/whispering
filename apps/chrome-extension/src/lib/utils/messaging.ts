import type { Icon } from '~background/setIcon';

export type MessageToBackgroundRequest =
	| {
			action: 'setExtensionIcon';
			icon: Icon;
	  }
	| {
			action: 'openOptionsPage';
	  };

/** Sends a message to the background script, captured in {@link ~background/index.ts}. */
export function sendMessageToBackground(message: MessageToBackgroundRequest) {
	chrome.runtime.sendMessage(message);
}

export type MessageToContentScriptRequest =
	| {
			command: 'toggle-recording';
	  }
	| { command: 'switch-chatgpt-icon'; icon: Icon };
/** Sends a message to the content script, captured in {@link ~contents/globalToggleRecording}. */
export async function sendMessageToContentScript(message: MessageToContentScriptRequest) {
	const [tab] = await chrome.tabs.query({
		active: true,
		lastFocusedWindow: true
	});
	chrome.tabs.sendMessage(tab.id, message);
}
