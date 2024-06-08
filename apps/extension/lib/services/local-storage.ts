import { Storage } from '@plasmohq/storage';
import { Data, Effect } from 'effect';
import { z } from 'zod';

export class LocalstorageStorageError extends Data.TaggedError('LocalstorageStorageError')<{
	title: string;
	description?: string;
	error: unknown;
}> {}

const storage = new Storage();

const settingsSchema = z.object({
	isPlaySoundEnabled: z.boolean(),
	isCopyToClipboardEnabled: z.boolean(),
	isPasteContentsOnSuccessEnabled: z.boolean(),
	selectedAudioInputDeviceId: z.string(),
	currentLocalShortcut: z.string(),
	currentGlobalShortcut: z.string(),
	apiKey: z.string(),
	outputLanguage: z.string(),
});

export type Settings = z.infer<typeof settingsSchema>;

const localstorageSchemas = {
	'whispering-settings': settingsSchema,
} as const;

export const localStorageService = {
	get: <K extends keyof typeof localstorageSchemas>({
		key,
		defaultValue,
	}: {
		key: K;
		defaultValue: z.infer<(typeof localstorageSchemas)[K]>;
	}): Effect.Effect<z.infer<(typeof localstorageSchemas)[K]>> =>
		Effect.tryPromise({
			try: async () => {
				const valueFromStorage = localStorage.getItem(key);
				const isEmpty = valueFromStorage === null;
				if (isEmpty) return defaultValue;
				return localstorageSchemas[key].parse(JSON.parse(valueFromStorage));
			},
			catch: (error) =>
				new LocalstorageStorageError({
					title: `Error getting from local storage for key: ${key}`,
					description: error instanceof Error ? error.message : undefined,
					error,
				}),
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends keyof typeof localstorageSchemas>({
		key,
		value,
	}: {
		key: K;
		value: z.infer<(typeof localstorageSchemas)[K]>;
	}): Effect.Effect<void, LocalstorageStorageError> =>
		Effect.tryPromise({
			try: () => localStorage.setItem(key, JSON.stringify(value)),
			catch: (error) => {
				return new LocalstorageStorageError({
					title: `Error setting in local storage for key: ${key}`,
					description: error instanceof Error ? error.message : undefined,
					error,
				});
			},
		}),
	watch: <K extends keyof typeof localstorageSchemas>({
		key,
		callback,
	}: {
		key: K;
		callback: (newValue: z.infer<(typeof localstorageSchemas)[K]>) => void;
	}) =>
		Effect.try({
			try: () => {
				storage.watch({
					[key]: ({ newValue: newValueUnparsed }) => {
						const newValueParseResult = localstorageSchemas[key].safeParse(newValueUnparsed);
						if (!newValueParseResult.success) {
							console.error(
								`Error parsing change for key: ${key}`,
								newValueParseResult.error.errors,
							);
							return;
						}
						const newValue = newValueParseResult.data;
						callback(newValue);
					},
				});
			},
			catch: (error) =>
				new LocalstorageStorageError({
					title: `Error watching local storage for key: ${key}`,
					description: error instanceof Error ? error.message : undefined,
					error,
				}),
		}),
} as const;