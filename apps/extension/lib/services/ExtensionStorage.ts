import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { z } from 'zod';

export class ExtensionStorageError extends Data.TaggedError('ExtensionStorageError')<{
	message: string;
	origError?: unknown;
}> {}

export class ExtensionStorageService extends Context.Tag('ExtensionStorageService')<
	ExtensionStorageService,
	{
		readonly get: <TSchema extends z.ZodTypeAny>({
			key,
			schema,
			defaultValue,
		}: {
			key: string;
			schema: TSchema;
			defaultValue: z.infer<TSchema>;
		}) => Effect.Effect<z.infer<TSchema>, ExtensionStorageError>;
		readonly set: (args: {
			key: string;
			value: string;
		}) => Effect.Effect<void, ExtensionStorageError>;
	}
>() {}
