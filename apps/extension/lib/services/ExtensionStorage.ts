import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { z } from 'zod';

export class ExtensionStorageError extends Data.TaggedError('ExtensionStorageError')<{
	message: string;
	origError?: unknown;
}> {}

type ExtensionKey =
	| 'whispering-recording-state'
	| 'whispering-toast'
	| 'whispering-settings'
	| 'whispering-recording-tab-id';

export class ExtensionStorageService extends Context.Tag('ExtensionStorageService')<
	ExtensionStorageService,
	{
		readonly get: <TSchema extends z.ZodTypeAny>({
			key,
			schema,
			defaultValue,
		}: {
			key: ExtensionKey;
			schema: TSchema;
			defaultValue: z.infer<TSchema>;
		}) => Effect.Effect<z.infer<TSchema>, ExtensionStorageError>;
		readonly set: <T>(args: {
			key: ExtensionKey;
			value: T;
		}) => Effect.Effect<void, ExtensionStorageError>;
		readonly watch: <TSchema extends z.ZodTypeAny>(args: {
			key: ExtensionKey;
			schema: TSchema;
			callback: (newValue: z.infer<TSchema>) => void;
		}) => Effect.Effect<void, ExtensionStorageError>;
	}
>() {}
