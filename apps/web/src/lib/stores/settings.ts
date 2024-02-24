import storedWritable from '@efstajas/svelte-stored-writable';
import { z } from 'zod';

const settingsSchema = z.object({
	copyToClipboard: z.boolean(),
	pasteContentsOnSuccess: z.boolean(),
	currentGlobalShortcut: z.string()
});

type Settings = z.infer<typeof settingsSchema>;

const SETTINGS_OPTIONS: Settings = {
	copyToClipboard: true,
	pasteContentsOnSuccess: false,
	currentGlobalShortcut: 'CommandOrControl+Shift+;'
};

export const settings = storedWritable('options', settingsSchema, SETTINGS_OPTIONS);
