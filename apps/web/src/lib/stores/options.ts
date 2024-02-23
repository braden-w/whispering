import storedWritable from '@efstajas/svelte-stored-writable';
import { z } from 'zod';

const optionsSchema = z.object({
	copyToClipboard: z.boolean(),
	pasteContentsOnSuccess: z.boolean(),
	currentGlobalShortcut: z.string()
});

type Options = z.infer<typeof optionsSchema>;

const DEFAULT_OPTIONS: Options = {
	copyToClipboard: true,
	pasteContentsOnSuccess: false,
	currentGlobalShortcut: 'CommandOrControl+Shift+;'
};

export const options = storedWritable('options', optionsSchema, DEFAULT_OPTIONS);
