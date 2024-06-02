// import {
//   sendMessageToContentScript,
//   type MessageToBackgroundRequest
// } from "$lib/utils/messaging"

import { Effect } from 'effect';
import { sendMessageToContentScript } from '~lib/utils/messaging';

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'install') {
		chrome.runtime.openOptionsPage();
	}
});

chrome.commands.onCommand.addListener((command) =>
	Effect.gen(function* (_) {
		if (command === 'toggle-recording') {
			const activeTabs = yield* Effect.promise(() =>
				chrome.tabs.query({ active: true, currentWindow: true }),
			);
			if (!activeTabs[0]) return;
			const activeTab = activeTabs[0];
			yield* sendMessageToContentScript(activeTab.id, { action: 'toggle-recording' });
		}
	}),
);

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
