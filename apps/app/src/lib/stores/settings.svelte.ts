import { createPersistedState } from '$lib/createPersistedState.svelte';
import { z } from 'zod';

export const settings = createPersistedState({
	key: 'whispering-settings',
	schema: z.object({
		isCopyToClipboardEnabled: z.boolean(),
		isPasteContentsOnSuccessEnabled: z.boolean(),
		currentGlobalShortcut: z.string(),
		apiKey: z.string(),
		outputLanguage: z.string()
	}),
	defaultValue: {
		isCopyToClipboardEnabled: true,
		isPasteContentsOnSuccessEnabled: false,
		currentGlobalShortcut: 'CommandOrControl+Shift+;',
		apiKey: '',
		outputLanguage: 'en'
	}
});
