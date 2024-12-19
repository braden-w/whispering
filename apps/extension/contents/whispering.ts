import { relayMessage } from '@plasmohq/messaging';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: [
		'https://whispering.bradenwong.com/*',
		'http://localhost:5173/*',
		'http://localhost:4173/*',
	],
};

relayMessage({ name: 'whispering-extension/notifications/clear' });
relayMessage({ name: 'whispering-extension/notifications/create' });
relayMessage({ name: 'whispering-extension/notifyWhisperingTabReady' });
relayMessage({ name: 'whispering-extension/playSound' });
relayMessage({ name: 'whispering-extension/setClipboardText' });
relayMessage({ name: 'whispering-extension/setRecorderState' });
relayMessage({ name: 'whispering-extension/writeTextToCursor' });
