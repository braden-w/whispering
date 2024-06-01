import { openDB, type DBSchema } from 'idb';
// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import { Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import type { MessageToContentScriptRequest } from '~lib/utils/messaging';
import type { Recording } from '../../../packages/services/src/services/recordings-db';
// import { CHATGPT_DOMAINS } from './chatGptButton';

export const config: PlasmoCSConfig = {
	matches: ['http://localhost:5173/*'],
	// exclude_matches: CHATGPT_DOMAINS,
};

const DB_NAME = 'RecordingDB' as const;
const DB_VERSION = 1 as const;
const RECORDING_STORE = 'recordings' as const;

interface RecordingsDbSchema extends DBSchema {
	recordings: {
		key: Recording['id'];
		value: Recording;
	};
}

chrome.runtime.onMessage.addListener(
	(message: MessageToContentScriptRequest, sender, sendResponse) => {
		if (message.action === 'getLocalStorage') {
			const a = localStorage.getItem('whispering-api-key');
			console.log('🚀 ~ a:', a);
			openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
				upgrade(db) {
					const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
					if (!isRecordingStoreObjectStoreExists) {
						db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
					}
				},
			}).then((db) => {
				const b = db.getAll(RECORDING_STORE);
				sendResponse({ a, b });
				// return b;
			});
			// storageService.getLocalStorage(message.key).then(sendResponse);
		} // else if (message.action === 'setLocalStorage') {
		// storageService.setLocalStorage(message.key, message.value).then(sendResponse);
		// } else if (message.action === 'getIndexedDB') {
		// 	storageService.getIndexedDB(message.store, message.key).then(sendResponse);
		// } else if (message.action === 'setIndexedDB') {
		// 	storageService.setIndexedDB(message.store, message.key, message.value).then(sendResponse);
		// }
		return true; // Will respond asynchronously.
	},
);

// chrome.runtime.onMessage.addListener(function (message: MessageToContentScriptRequest) {
// 	if (message.action === 'toggle-recording') recorder.toggleRecording();
// });
