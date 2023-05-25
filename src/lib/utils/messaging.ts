import type { Icon } from '~background/setIcon';

export type Request =
	| {
			action: 'setIcon';
			icon: Icon;
	  }
	| {
			action: 'openOptionsPage';
	  };

export function sendMessageToBackground(request: Request) {
	chrome.runtime.sendMessage(request);
}
