import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import { Effect, Layer } from 'effect';
import {
	RegisterShortcutsError,
	RegisterShortcutsService,
} from '../../services/register-shortcuts';

export const RegisterShortcutsDesktopLive = Layer.effect(
	RegisterShortcutsService,
	Effect.gen(function* () {
		return {
			defaultShortcut: 'CommandOrControl+Shift+;',
			unregisterAll: () =>
				Effect.tryPromise({
					try: () => unregisterAll(),
					catch: (error) =>
						new RegisterShortcutsError({
							message: 'Error unregistering all shortcuts',
							origError: error,
						}),
				}),
			register: ({ shortcut, callback }) =>
				Effect.tryPromise({
					try: () => register(shortcut, callback),
					catch: (error) =>
						new RegisterShortcutsError({
							message: 'Error registering shortcut',
							origError: error,
						}),
				}),
		};
	}),
);
