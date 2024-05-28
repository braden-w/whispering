import type { Effect } from 'effect';
import { Context, Data } from 'effect';
import type { NoSuchElementException } from 'effect/Cause';

export class RegisterShortcutsError extends Data.TaggedError('RegisterShortcutsError')<{
	message: string;
	origError?: unknown;
}> {}

export class RegisterShortcutsService extends Context.Tag('RegisterShortcutsService')<
	RegisterShortcutsService,
	{
		readonly defaultShortcut: string;
		readonly unregisterAll: () => Effect.Effect<
			void,
			RegisterShortcutsError | NoSuchElementException
		>;
		readonly register: (
			shortcut: string,
			callback: () => void,
		) => Effect.Effect<void, RegisterShortcutsError | NoSuchElementException>;
	}
>() {}
