// import {
//   sendMessageToContentScript,
//   type MessageToBackgroundRequest
// } from "$lib/utils/messaging"

import { setIcon } from './setIcon';

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'install') {
		chrome.runtime.openOptionsPage();
	}
});

chrome.commands.onCommand.addListener(async function (command) {
	if (command === 'toggle-recording') {
		// sendMessageToContentScript({ command: "toggle-recording" })
	}
});

// chrome.runtime.onMessage.addListener(function (
//   message: MessageToBackgroundRequest
// ) {
//   switch (message.action) {
//     case "setExtensionIcon":
//       setIcon(message.icon)
//       break
//     case "openOptionsPage":
//       chrome.runtime.openOptionsPage()
//       break
//   }
// })

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (
		['getLocalStorage', 'setLocalStorage', 'getIndexedDB', 'setIndexedDB'].includes(message.action)
	) {
		const whisperingTabId = await getOrCreateWhisperingTab();
		chrome.scripting.executeScript(
			{
				target: { tabId: whisperingTabId },
				files: ['scripts/content.js'],
			},
			() => {
				chrome.tabs.sendMessage(whisperingTabId, message, sendResponse);
			},
		);

		return true; // Will respond asynchronously.
	}
});

function getOrCreateWhisperingTab() {
	return new Promise<number>((resolve, reject) => {
		chrome.tabs.query({ url: 'https://www.whispering.com/*' }, (tabs) => {
			if (tabs.length > 0) {
				for (const tab of tabs) {
					if (tab.pinned) {
						resolve(tab.id);
					}
				}
				resolve(tabs[0].id);
			} else {
				chrome.tabs.create(
					{ url: 'https://www.whispering.com', active: false, pinned: true },
					(tab) => {
						resolve(tab.id);
					},
				);
			}
		});
	});
}
