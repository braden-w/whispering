import { openDB, type DBSchema } from 'idb';
// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import { Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import { z } from 'zod';
import { AppStorageFromContentScriptLive } from '~lib/storage/AppStorageLive';
import { type MessageToContentScriptRequest } from '~lib/utils/messaging';
import { AppStorageService } from '../../../packages/services/src/services/app-storage';
import type { Recording } from '../../../packages/services/src/services/recordings-db';
// import { CHATGPT_DOMAINS } from './chatGptButton';

export const config: PlasmoCSConfig = {
	// matches: ['http://localhost:5173/*'],
	// matches: ['http://localhost:5173/*'],
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

export type Settings = {
	isPlaySoundEnabled: boolean;
	isCopyToClipboardEnabled: boolean;
	isPasteContentsOnSuccessEnabled: boolean;
	apiKey: string;
	outputLanguage: string;
};

export const defaultSettings = {
	isPlaySoundEnabled: true,
	isCopyToClipboardEnabled: true,
	isPasteContentsOnSuccessEnabled: true,
	apiKey: '',
	outputLanguage: 'en',
};

chrome.runtime.onMessage.addListener(
	(message: MessageToContentScriptRequest, sender, sendResponse) =>
		Effect.gen(function* () {
			const appStorageService = yield* AppStorageService;
			if (message.action === 'getSettingsFromWhisperingLocalStorage') {
				const settings: Settings = {
					isPlaySoundEnabled: yield* appStorageService.get({
						key: 'whispering-is-play-sound-enabled',
						schema: z.boolean(),
						defaultValue: true,
					}),
					isCopyToClipboardEnabled: yield* appStorageService.get({
						key: 'whispering-is-copy-to-clipboard-enabled',
						schema: z.boolean(),
						defaultValue: true,
					}),
					isPasteContentsOnSuccessEnabled: yield* appStorageService.get({
						key: 'whispering-is-paste-contents-on-success-enabled',
						schema: z.boolean(),
						defaultValue: true,
					}),
					apiKey: yield* appStorageService.get({
						key: 'whispering-api-key',
						schema: z.string(),
						defaultValue: '',
					}),
					outputLanguage: yield* appStorageService.get({
						key: 'whispering-output-language',
						schema: z.string(),
						defaultValue: 'en',
					}),
				};
				sendResponse(settings);
			} else if (message.action === 'getLocalStorage') {
				const { key } = message;
				const value = yield* appStorageService.get({
					key,
					schema: z.string(),
					defaultValue: '',
				});
			} else if (message.action === 'getIndexedDb' || message.action === 'setIndexedDb') {
				openDB<RecordingsDbSchema>(DB_NAME, DB_VERSION, {
					upgrade(db) {
						const isRecordingStoreObjectStoreExists = db.objectStoreNames.contains(RECORDING_STORE);
						if (!isRecordingStoreObjectStoreExists) {
							db.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
						}
					},
				}).then((db) => {
					const b = db.getAll(RECORDING_STORE);
					sendResponse(b);
					// return b;
				});
			}
			// else if (message.action === 'setLocalStorage') {
			// storageService.setLocalStorage(message.key, message.value).then(sendResponse);
			// } else if (message.action === 'getIndexedDB') {
			// 	storageService.getIndexedDB(message.store, message.key).then(sendResponse);
			// } else if (message.action === 'setIndexedDB') {
			// 	storageService.setIndexedDB(message.store, message.key, message.value).then(sendResponse);
			// }
			return true; // Will respond asynchronously.
		}).pipe(Effect.provide(AppStorageFromContentScriptLive), Effect.runPromise),
);

// chrome.runtime.onMessage.addListener(function (message: MessageToContentScriptRequest) {
// 	if (message.action === 'toggleRecording') recorder.toggleRecording();
// });
