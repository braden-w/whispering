import storedWritable from 'svelte-persisted-writable';
import { z } from 'zod';

const settingsSchema = z.object({
	copyToClipboard: z.boolean(),
	pasteContentsOnSuccess: z.boolean(),
	currentGlobalShortcut: z.string(),
	apiKey: z.string()
});

type Settings = z.infer<typeof settingsSchema>;

const SETTINGS_DEFAULT: Settings = {
	copyToClipboard: true,
	pasteContentsOnSuccess: false,
	currentGlobalShortcut: 'CommandOrControl+Shift+;',
	apiKey: ''
};

export const settings = storedWritable('whispering-settings', settingsSchema, SETTINGS_DEFAULT);
