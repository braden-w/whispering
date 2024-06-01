// import type { Icon } from '$background/setIcon';

export type MessageToBackgroundRequest =
	| {
			action: 'setExtensionIcon';
			// icon: Icon;
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
			action: 'toggle-recording';
	  }
	// | { action: 'switch-chatgpt-icon'; icon: Icon }
	| {
			action: 'openOptionsPage';
	  }
	| {
			action: 'getLocalStorage';
			key: string;
	  }
	| {
			action: 'setLocalStorage';
			key: string;
			value: string;
	  }
	| {
			action: 'getIndexedDb';
	  }
	| {
			action: 'setIndexedDb';
	  };
/** Sends a message to the content script, captured in {@link ~contents/globalToggleRecording}. */
// export async function sendMessageToContentScript(message: MessageToContentScriptRequest) {
// 	const [tab] = await chrome.tabs.query({
// 		active: true,
// 		lastFocusedWindow: true,
// 	});
// 	chrome.tabs.sendMessage(tab.id, message);
// }
