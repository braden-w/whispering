// import type { Icon } from '$background/setIcon';

import { Effect } from 'effect';
import { useEffect, useState } from 'react';
import type { z } from 'zod';

type Icon = 'studioMicrophone' | 'redLargeSquare' | 'arrowsCounterclockwise';
export type MessageToBackgroundRequest =
	| {
			action: 'setIcon';
			icon: Icon;
	  }
	| {
			action: 'openOptionsPage';
	  };

/** Sends a message to the background script, captured in {@link ~background/index.ts}. */
export const sendMessageToBackground = <R>(message: MessageToBackgroundRequest) => {
	chrome.runtime.sendMessage<MessageToBackgroundRequest, R>(message);
};

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
			action: 'getSettingsFromWhisperingLocalStorage';
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

export function getLocalStorageFromTab<TSchema extends z.ZodTypeAny>({
	tabId,
	key,
	schema,
	defaultValue,
}: {
	tabId: number;
	key: string;
	schema: TSchema;
	defaultValue: z.infer<TSchema>;
}) {
	const [state, setState] = useState<z.infer<TSchema>>(defaultValue);

	const syncState = () => loadValueFromStorage().then(setState);

	useEffect(() => {
		syncState();
		sendMessageToContentScript(tabId, {
			action: 'registerListener',
			callback: (event) => {
				console.log('🚀 ~ registerSyncListener ~ event:', event);
				if (event.key === key) {
					syncState();
				}
			},
		});
	});

	return state;
}

/** Sends a message to the content script, captured in {@link ~contents/globalToggleRecording}. */
// export async function sendMessageToContentScript(message: MessageToContentScriptRequest) {
// 	const [tab] = await chrome.tabs.query({
// 		active: true,
// 		lastFocusedWindow: true,
// 	});
// 	chrome.tabs.sendMessage(tab.id, message);
// }
