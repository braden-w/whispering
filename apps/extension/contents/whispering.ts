import { relayMessage } from '@plasmohq/messaging';
import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
	matches: ['https://whispering.bradenwong.com/*', 'http://localhost:5173/*'],
};

relayMessage({ name: 'external/getTabSenderId' });
relayMessage({ name: 'external/notifyWhisperingTabReady' });
relayMessage({ name: 'external/playSound' });
relayMessage({ name: 'external/setClipboardText' });
relayMessage({ name: 'external/setRecorderState' });
relayMessage({ name: 'external/toast' });
relayMessage({ name: 'external/writeTextToCursor' });
