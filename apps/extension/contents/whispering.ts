import { relayMessage } from '@plasmohq/messaging';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: [
		'https://whispering.bradenwong.com/*',
		'http://localhost:5173/*',
		'http://localhost:4173/*',
	],
};

relayMessage({ name: 'extension/clearNotification' });
relayMessage({ name: 'extension/createNotification' });
relayMessage({ name: 'extension/notifyWhisperingTabReady' });
relayMessage({ name: 'extension/openWhisperingTab' });
relayMessage({ name: 'extension/ping' });
relayMessage({ name: 'extension/playSound' });
relayMessage({ name: 'extension/setClipboardText' });
relayMessage({ name: 'extension/setRecorderState' });
relayMessage({ name: 'extension/writeTextToCursor' });
