import { Effect, Layer } from 'effect';
import hotkeys from 'hotkeys-js';
import {
	RegisterShortcutsError,
	RegisterShortcutsService,
} from '../../services/register-shortcuts';

export const RegisterShortcutsWeb = Layer.effect(
	RegisterShortcutsService,
	Effect.gen(function* () {
		return {
			defaultShortcut: 'ctrl+shift+x, command+shift+x',
			unregisterAll: () =>
				Effect.try({
					try: () => hotkeys.unbind(),
					catch: (error) =>
						new RegisterShortcutsError({
							message: 'Error unregistering all shortcuts',
							origError: error,
						}),
				}),
			register: ({ shortcut, callback }) =>
				Effect.try({
					try: () =>
						hotkeys(shortcut, function (event, handler) {
							// Prevent the default refresh event under WINDOWS system
							event.preventDefault();
							callback();
						}),
					catch: (error) =>
						new RegisterShortcutsError({
							message: 'Error registering shortcut',
							origError: error,
						}),
				}),
		};
	}),
);
