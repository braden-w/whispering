import type { WhisperingError } from '@repo/shared';
import type { Effect } from 'effect';
import { Context } from 'effect';

export class RegisterShortcutsService extends Context.Tag('RegisterShortcutsService')<
	RegisterShortcutsService,
	{
		readonly isGlobalShortcutEnabled: boolean;
		readonly defaultLocalShortcut: string;
		readonly defaultGlobalShortcut: string;
		readonly unregisterAllLocalShortcuts: Effect.Effect<void, WhisperingError>;
		readonly unregisterAllGlobalShortcuts: Effect.Effect<void, WhisperingError>;
		readonly registerLocalShortcut: (args: {
			shortcut: string;
			callback: () => void;
		}) => Effect.Effect<void, WhisperingError>;
		readonly registerGlobalShortcut: (args: {
			shortcut: string;
			callback: () => void;
		}) => Effect.Effect<void, WhisperingError>;
	}
>() {}
