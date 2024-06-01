import { Effect } from 'effect';
import { z } from 'zod';
import { getOrCreateWhisperingTab } from '~background';
import { createGetLocalStorageForTab } from './utils/messaging';

const createSettings = async function () {
	const whisperingTabId = await getOrCreateWhisperingTab();
	const getLocalStorage = createGetLocalStorageForTab(whisperingTabId);
	const isPlaySoundEnabled = getLocalStorage({
		key: 'whispering-is-play-sound-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	getLocalStorage({
		key: 'whispering-is-play-sound-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const isCopyToClipboardEnabled = getLocalStorage({
		key: 'whispering-is-copy-to-clipboard-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const isPasteContentsOnSuccessEnabled = getLocalStorage({
		key: 'whispering-is-paste-contents-on-success-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const apiKey = getLocalStorage({
		key: 'whispering-api-key',
		schema: z.string(),
		defaultValue: '',
	});
	const outputLanguage = getLocalStorage({
		key: 'whispering-output-language',
		schema: z.string(),
		defaultValue: 'en',
	});

	return {
		get isPlaySoundEnabled() {
			return isPlaySoundEnabled;
		},
		get isCopyToClipboardEnabled() {
			return isCopyToClipboardEnabled;
		},
		get isPasteContentsOnSuccessEnabled() {
			return isPasteContentsOnSuccessEnabled;
		},
		get apiKey() {
			return apiKey;
		},
		get outputLanguage() {
			return outputLanguage;
		},
	};
};

export const settings = createSettings();
