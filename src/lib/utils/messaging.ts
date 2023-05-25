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
