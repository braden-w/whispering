import persistedWritable from '@epicenterhq/svelte-persisted-writable';
import { z } from 'zod';

const settingsSchema = z.object({
	isCopyToClipboardEnabled: z.boolean(),
	isPasteContentsOnSuccessEnabled: z.boolean(),
	currentGlobalShortcut: z.string(),
	apiKey: z.string(),
	outputLanguage: z.union([z.string(), z.null()])
});

type Settings = z.infer<typeof settingsSchema>;

const SETTINGS_DEFAULT: Settings = {
	isCopyToClipboardEnabled: true,
	isPasteContentsOnSuccessEnabled: false,
	currentGlobalShortcut: 'CommandOrControl+Shift+;',
	apiKey: '',
	outputLanguage: 'English'
};

export const settings = persistedWritable({
	key: 'whispering-settings',
	schema: settingsSchema,
	initialValue: SETTINGS_DEFAULT
});
