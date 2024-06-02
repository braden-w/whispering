import { Effect, Layer } from 'effect';
import hotkeys from 'hotkeys-js';
import { toast } from 'svelte-sonner';
import {
	RegisterShortcutsError,
	RegisterShortcutsService,
} from '../../services/register-shortcuts';

export const RegisterShortcutsWebLive = Layer.effect(
	RegisterShortcutsService,
	Effect.gen(function* () {
		return {
			isGlobalShortcutEnabled: false,
			defaultLocalShortcut: 'space',
			defaultGlobalShortcut: '',
			unregisterAllLocalShortcuts: () =>
				Effect.try({
					try: () => hotkeys.unbind(),
					catch: (error) =>
						new RegisterShortcutsError({
							message: 'Error unregistering all shortcuts',
							origError: error,
						}),
				}),
			unregisterAllGlobalShortcuts: () =>
				Effect.try({
					try: () => hotkeys.unbind(),
					catch: (error) =>
						new RegisterShortcutsError({
							message: 'Error unregistering all shortcuts',
							origError: error,
						}),
				}),
			registerLocalShortcut: ({ shortcut, callback }) =>
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
			registerGlobalShortcut: ({ shortcut, callback }) =>
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
