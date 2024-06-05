import { openDB, type DBSchema } from 'idb';
// import { type MessageToContentScriptRequest } from '$lib/utils/messaging';
import { Effect } from 'effect';
import type { PlasmoCSConfig } from 'plasmo';
import { z } from 'zod';
import { commands, type MessageToContext } from '~lib/utils/commands';
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
	(message: MessageToContext<'WhisperingContentScript'>, sender, sendResponse) =>
		Effect.gen(function* () {
			const { commandName, args } = message;
			const correspondingCommand = commands[commandName];
			sendResponse(yield* correspondingCommand.runInWhisperingContentScript(...args));
			return true; // Will respond asynchronously.
		}).pipe(Effect.runPromise),
);

// chrome.runtime.onMessage.addListener(function (message: MessageToContentScriptRequest) {
// 	if (message.action === 'toggleRecording') recorder.toggleRecording();
// });
