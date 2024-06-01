import { z } from 'zod';
import { getOrCreateWhisperingTab } from '~background';
import { createGetLocalStorageForTab } from './utils/messaging';

export const settings = {
	async getIsPlaySoundEnabled() {
		const whisperingTabId = await getOrCreateWhisperingTab();
		const getLocalStorage = createGetLocalStorageForTab(whisperingTabId);
		const isPlaySoundEnabled = await getLocalStorage({
			key: 'whispering-is-play-sound-enabled',
			schema: z.boolean(),
			defaultValue: true,
		});
		return isPlaySoundEnabled;
	},
	async getIsCopyToClipboardEnabled() {
		const whisperingTabId = await getOrCreateWhisperingTab();
		const getLocalStorage = createGetLocalStorageForTab(whisperingTabId);
		const isCopyToClipboardEnabled = await getLocalStorage({
			key: 'whispering-is-copy-to-clipboard-enabled',
			schema: z.boolean(),
			defaultValue: true,
		});
		return isCopyToClipboardEnabled;
	},
	async getIsPasteContentsOnSuccessEnabled() {
		const whisperingTabId = await getOrCreateWhisperingTab();
		const getLocalStorage = createGetLocalStorageForTab(whisperingTabId);
		const isPasteContentsOnSuccessEnabled = await getLocalStorage({
			key: 'whispering-is-paste-contents-on-success-enabled',
			schema: z.boolean(),
			defaultValue: true,
		});
		return isPasteContentsOnSuccessEnabled;
	},
	async getApiKey() {
		const whisperingTabId = await getOrCreateWhisperingTab();
		const getLocalStorage = createGetLocalStorageForTab(whisperingTabId);
		const apiKey = await getLocalStorage({
			key: 'whispering-api-key',
			schema: z.string(),
			defaultValue: '',
		});
		return apiKey;
	},
	async getOutputLanguage() {
		const whisperingTabId = await getOrCreateWhisperingTab();
		const getLocalStorage = createGetLocalStorageForTab(whisperingTabId);
		const outputLanguage = await getLocalStorage({
			key: 'whispering-output-language',
			schema: z.string(),
			defaultValue: 'en',
		});
		return outputLanguage;
	},
};
