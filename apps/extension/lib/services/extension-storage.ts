import { Storage } from '@plasmohq/storage';
import { Data, Effect } from 'effect';
import { z } from 'zod';

export class ExtensionStorageError extends Data.TaggedError('ExtensionStorageError')<{
	title: string;
	description?: string;
	error: unknown;
}> {}

const storage = new Storage();

const extensionSchemas = {
	'whispering-recording-state': z.union([
		z.literal('IDLE'),
		z.literal('PAUSED'),
		z.literal('RECORDING'),
	]),
	'whispering-toast': z.object({
		title: z.string(),
		description: z.string().optional(),
		variant: z.union([z.literal('default'), z.literal('destructive')]),
	}),
	'whispering-recording-tab-id': z.string(),
} as const;

export const extensionStorage = {
	get: <K extends keyof typeof extensionSchemas>({
		key,
		defaultValue,
	}: {
		key: K;
		defaultValue: z.infer<(typeof extensionSchemas)[K]>;
	}): Effect.Effect<z.infer<(typeof extensionSchemas)[K]>> =>
		Effect.tryPromise({
			try: async () => {
				const unparsedValue = await storage.get(key);
				if (unparsedValue === null) {
					return defaultValue;
				}
				return extensionSchemas[key].parse(unparsedValue);
			},
			catch: (error) =>
				new ExtensionStorageError({
					title: `Error getting from local storage for key: ${key}`,
					description: error instanceof Error ? error.message : undefined,
					error,
				}),
		}).pipe(Effect.catchAll(() => Effect.succeed(defaultValue))),
	set: <K extends keyof typeof extensionSchemas>({
		key,
		value,
	}: {
		key: K;
		value: z.infer<(typeof extensionSchemas)[K]>;
	}): Effect.Effect<void, ExtensionStorageError> =>
		Effect.tryPromise({
			try: () => storage.set(key, value),
			catch: (error) => {
				return new ExtensionStorageError({
					title: `Error setting in local storage for key: ${key}`,
					description: error instanceof Error ? error.message : undefined,
					error,
				});
			},
		}),
	watch: <K extends keyof typeof extensionSchemas>({
		key,
		callback,
	}: {
		key: K;
		callback: (newValue: z.infer<(typeof extensionSchemas)[K]>) => void;
	}) =>
		Effect.try({
			try: () => {
				storage.watch({
					[key]: ({ newValue: newValueUnparsed }) => {
						const newValueParseResult = extensionSchemas[key].safeParse(newValueUnparsed);
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
				new ExtensionStorageError({
					title: `Error watching local storage for key: ${key}`,
					description: error instanceof Error ? error.message : undefined,
					error,
				}),
		}),
} as const;

export const sendErrorToastViaStorage = (
	value: Omit<z.infer<(typeof extensionSchemas)['whispering-toast']>, 'variant'>,
) =>
	extensionStorage.set({
		key: 'whispering-toast',
		value: { ...value, variant: 'destructive' },
	});
