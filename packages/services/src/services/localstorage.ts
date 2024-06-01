import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { z } from 'zod';

export const LOCALSTORAGE_KEYS = {
	isPlaySoundEnabled: 'whispering-is-play-sound-enabled',
	isCopyToClipboardEnabled: 'whispering-is-copy-to-clipboard-enabled',
	isPasteContentsOnSuccessEnabled: 'whispering-is-paste-contents-on-success-enabled',
	currentLocalShortcut: 'whispering-current-local-shortcut',
	currentGlobalShortcut: 'whispering-current-global-shortcut',
	apiKey: 'whisper-api-key',
	outputLanguage: 'whispering-output-language',
	selectedAudioInputDeviceId: 'whispering-selected-audio-input-device-id',
	sorting: 'whispering-sorting',
	columnFilters: 'whispering-column-filters',
	columnVisibility: 'whispering-column-visibility',
	rowSelection: 'whispering-row-selection',
} as const;

export class LocalStorageError extends Data.TaggedError('LocalStorageError')<{
	message: string;
	origError?: unknown;
}> {}

export class LocalStorageService extends Context.Tag('LocalStorageService')<
	LocalStorageService,
	{
		readonly get: <TSchema extends z.ZodTypeAny>({
			key,
			schema,
			defaultValue,
		}: {
			key: string;
			schema: TSchema;
			defaultValue: z.infer<TSchema>;
		}) => Effect.Effect<z.infer<TSchema>, LocalStorageError>;
		readonly set: (args: { key: string; value: string }) => Effect.Effect<void, LocalStorageError>;
	}
>() {}
