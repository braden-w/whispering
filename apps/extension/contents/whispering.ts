import { relayMessage } from '@plasmohq/messaging';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ['https://whispering.bradenwong.com/*', 'http://localhost:5173/*'],
};

relayMessage({ name: 'external/notifications/clear' });
relayMessage({ name: 'external/notifications/create' });
relayMessage({ name: 'external/playSound' });
relayMessage({ name: 'external/setClipboardText' });
relayMessage({ name: 'external/setTrayIcon' });
relayMessage({ name: 'external/writeTextToCursor' });
