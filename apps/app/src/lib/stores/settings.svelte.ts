import { createPersistedState } from '$lib/createPersistedState.svelte';
import { z } from 'zod';

function createSettings() {
	const isCopyToClipboardEnabled = createPersistedState({
		key: 'whispering-is-copy-to-clipboard-enabled',
		schema: z.boolean(),
		defaultValue: true
	});
	const isPasteContentsOnSuccessEnabled = createPersistedState({
		key: 'whispering-is-paste-contents-on-success-enabled',
		schema: z.boolean(),
		defaultValue: false
	});
	const currentGlobalShortcut = createPersistedState({
		key: 'whispering-current-global-shortcut',
		schema: z.string(),
		defaultValue: 'CommandOrControl+Shift+;'
	});
	const apiKey = createPersistedState({
		key: 'whispering-api-key',
		schema: z.string(),
		defaultValue: ''
	});
	const outputLanguage = createPersistedState({
		key: 'whispering-output-language',
		schema: z.string(),
		defaultValue: 'en'
	});
	return {
		get isCopyToClipboardEnabled() {
			return isCopyToClipboardEnabled.value;
		},
		set isCopyToClipboardEnabled(newValue) {
			isCopyToClipboardEnabled.value = newValue;
		},
		get isPasteContentsOnSuccessEnabled() {
			return isPasteContentsOnSuccessEnabled.value;
		},
		set isPasteContentsOnSuccessEnabled(newValue) {
			isPasteContentsOnSuccessEnabled.value = newValue;
		},
		get currentGlobalShortcut() {
			return currentGlobalShortcut.value;
		},
		set currentGlobalShortcut(newValue) {
			currentGlobalShortcut.value = newValue;
		},
		get apiKey() {
			return apiKey.value;
		},
		set apiKey(newValue) {
			apiKey.value = newValue;
		},
		get outputLanguage() {
			return outputLanguage.value;
		},
		set outputLanguage(newValue) {
			outputLanguage.value = newValue;
		}
	};
}

export const settings = createSettings();
