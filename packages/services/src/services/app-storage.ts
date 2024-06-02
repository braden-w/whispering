import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { z } from 'zod';

export class AppStorageError extends Data.TaggedError('LocalStorageError')<{
	message: string;
	origError?: unknown;
}> {}

export class AppStorageService extends Context.Tag('AppStorageService')<
	AppStorageService,
	{
		readonly get: <TSchema extends z.ZodTypeAny>(args: {
			key: string;
			schema: TSchema;
			defaultValue: z.infer<TSchema>;
		}) => Effect.Effect<z.infer<TSchema>, AppStorageError>;
		readonly set: (args: { key: string; value: any }) => Effect.Effect<void, AppStorageError>;
	}
>() {}
