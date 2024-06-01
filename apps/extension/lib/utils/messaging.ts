// import type { Icon } from '$background/setIcon';

import React from 'react';
import type { z } from 'zod';
import { getOrCreateWhisperingTab } from '~background';

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
			action: 'registerListener';
			callback: (event: StorageEvent) => void;
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

export const sendMessageToContentScript = <R>(
	tabId: number,
	message: MessageToContentScriptRequest,
	options?: chrome.tabs.MessageSendOptions,
) => chrome.tabs.sendMessage<MessageToContentScriptRequest, R>(tabId, message, options);

export const useLocalStorageFromWhisperingTab = <TSchema extends z.ZodTypeAny>({
	key,
	schema,
	defaultValue,
}: {
	key: string;
	schema: TSchema;
	defaultValue: z.infer<TSchema>;
}) => {
	const [state, setState] = React.useState<z.infer<TSchema>>(defaultValue);
	async function loadValueFromStorage() {
		try {
			const tabId = await getOrCreateWhisperingTab();
			const unparsedValue = await sendMessageToContentScript(tabId, {
				action: 'getLocalStorage',
				key,
			});
			return schema.parse(unparsedValue) as z.infer<TSchema>;
		} catch {
			return defaultValue;
		}
	}
	async function syncState() {
		setState(loadValueFromStorage());
	}
};

/** Sends a message to the content script, captured in {@link ~contents/globalToggleRecording}. */
// export async function sendMessageToContentScript(message: MessageToContentScriptRequest) {
// 	const [tab] = await chrome.tabs.query({
// 		active: true,
// 		lastFocusedWindow: true,
// 	});
// 	chrome.tabs.sendMessage(tab.id, message);
// }
