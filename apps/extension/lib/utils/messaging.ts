// import type { Icon } from '$background/setIcon';

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
