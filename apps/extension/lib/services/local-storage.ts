import { Data, Effect } from 'effect';
import { z } from 'zod';

export const settingsSchema = z.object({
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

const localStorageSchemas = {
	'whispering-settings': settingsSchema,
} as const;

export class GetLocalStorageError<
	K extends keyof typeof localStorageSchemas,
> extends Data.TaggedError('GetLocalStorageError')<{
	key: K;
	defaultValue: z.infer<(typeof localStorageSchemas)[K]>;
	error: unknown;
}> {}

export class SetLocalStorageError<
	K extends keyof typeof localStorageSchemas,
> extends Data.TaggedError('SetLocalStorageError')<{
	key: K;
	value: z.infer<(typeof localStorageSchemas)[K]>;
	error: unknown;
}> {}

export const localStorageService = {
	get: <K extends keyof typeof localStorageSchemas>({
		key,
		defaultValue,
	}: {
		key: K;
		defaultValue: z.infer<(typeof localStorageSchemas)[K]>;
	}): Effect.Effect<z.infer<(typeof localStorageSchemas)[K]>> =>
		Effect.tryPromise({
			try: async () => {
				const valueFromStorage = localStorage.getItem(key);
				const isEmpty = valueFromStorage === null;
				if (isEmpty) return defaultValue;
				return localStorageSchemas[key].parse(JSON.parse(valueFromStorage));
			},
			catch: (error) =>
				new GetLocalStorageError({
					key,
					defaultValue,
					error,
				}),
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends keyof typeof localStorageSchemas>({
		key,
		value,
	}: {
		key: K;
		value: z.infer<(typeof localStorageSchemas)[K]>;
	}): Effect.Effect<void, SetLocalStorageError<K>> =>
		Effect.try({
			try: () => localStorage.setItem(key, JSON.stringify(value)),
			catch: (error) => {
				return new SetLocalStorageError({
					key,
					value,
					error,
				});
			},
		}),
} as const;
