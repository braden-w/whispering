import { get } from 'svelte/store';

import type { Icon } from '~background/setIcon';
import { writeTextToClipboard, writeTextToCursor } from '~lib/apis/clipboard';
import { options } from '~lib/stores/options';
import { type MessageToContentScriptRequest, sendMessageToBackground } from '~lib/utils/messaging';

import { toggleRecording } from './toggleRecording';

chrome.runtime.onMessage.addListener(async function (message: MessageToContentScriptRequest) {
	if (message.command === 'toggle-recording')
		await toggleRecording({
			switchIcon: (icon: Icon) => sendMessageToBackground({ action: 'setIcon', icon }),
			onSuccess: (text: string) => {
				if (get(options).copyToClipboard) writeTextToClipboard(text);
				writeTextToCursor(text);
			}
		});
});
