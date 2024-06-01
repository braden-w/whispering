import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { z } from 'zod';

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
		readonly set: (key: string, value: string) => Effect.Effect<void, LocalStorageError>;
	}
>() {}
