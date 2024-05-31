import type { Effect } from 'effect';
import { Context, Data } from 'effect';

export class RegisterShortcutsError extends Data.TaggedError('RegisterShortcutsError')<{
	renderAsToast: () => void;
	origError?: unknown;
}> {}

export class RegisterShortcutsService extends Context.Tag('RegisterShortcutsService')<
	RegisterShortcutsService,
	{
		readonly defaultLocalShortcut: string;
		readonly defaultGlobalShortcut: string;
		readonly unregisterAllLocalShortcuts: () => Effect.Effect<void, RegisterShortcutsError>;
		readonly unregisterAllGlobalShortcuts: () => Effect.Effect<void, RegisterShortcutsError>;
		readonly registerLocalShortcut: (args: {
			shortcut: string;
			callback: () => void;
		}) => Effect.Effect<void, RegisterShortcutsError>;
		readonly registerGlobalShortcut: (args: {
			shortcut: string;
			callback: () => void;
		}) => Effect.Effect<void, RegisterShortcutsError>;
	}
>() {}
