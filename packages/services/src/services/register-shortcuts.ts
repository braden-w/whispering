import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class RegisterShortcutsError extends Data.TaggedError('RegisterShortcutsError')<{
	renderAsToast: () => void;
	origError?: unknown;
}> {}

export class RegisterShortcutsService extends Context.Tag('RegisterShortcutsService')<
	RegisterShortcutsService,
	{
		readonly defaultShortcut: string;
		readonly unregisterAll: () => Effect.Effect<void, RegisterShortcutsError>;
		readonly register: (args: {
			shortcut: string;
			callback: () => void;
		}) => Effect.Effect<void, RegisterShortcutsError>;
	}
>() {}
