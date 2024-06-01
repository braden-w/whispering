import { Effect } from 'effect';
import { z } from 'zod';
import { getOrCreateWhisperingTab } from '~background';
import { createGetLocalStorageForTab } from './utils/messaging';

const createSettings = async function () {
	const whisperingTabId = await getOrCreateWhisperingTab();
	const getLocalStorage = createGetLocalStorageForTab(whisperingTabId);
	const isPlaySoundEnabledPromise = getLocalStorage({
		key: 'whispering-is-play-sound-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const isCopyToClipboardEnabledPromise = getLocalStorage({
		key: 'whispering-is-copy-to-clipboard-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const isPasteContentsOnSuccessEnabledPromise = getLocalStorage({
		key: 'whispering-is-paste-contents-on-success-enabled',
		schema: z.boolean(),
		defaultValue: true,
	});
	const apiKeyPromise = getLocalStorage({
		key: 'whispering-api-key',
		schema: z.string(),
		defaultValue: '',
	});
	const outputLanguagePromise = getLocalStorage({
		key: 'whispering-output-language',
		schema: z.string(),
		defaultValue: 'en',
	});
	const [
		isPlaySoundEnabled,
		isCopyToClipboardEnabled,
		isPasteContentsOnSuccessEnabled,
		apiKey,
		outputLanguage,
	] = await Promise.all([
		isPlaySoundEnabledPromise,
		isCopyToClipboardEnabledPromise,
		isPasteContentsOnSuccessEnabledPromise,
		apiKeyPromise,
		outputLanguagePromise,
	]);
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
