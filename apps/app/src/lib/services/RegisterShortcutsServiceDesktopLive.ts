import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import { Effect, Layer } from 'effect';
import hotkeys from 'hotkeys-js';
import { RegisterShortcutsError, RegisterShortcutsService } from './RegisterShortcutsService';

export const RegisterShortcutsDesktopLive = Layer.effect(
	RegisterShortcutsService,
	Effect.gen(function* () {
		return {
			isGlobalShortcutEnabled: true,
			defaultLocalShortcut: 'space',
			defaultGlobalShortcut: 'CommandOrControl+Shift+;',
			unregisterAllLocalShortcuts: () =>
				Effect.try({
					try: () => hotkeys.unbind(),
					catch: (error) =>
						new RegisterShortcutsError({
							title: 'Error unregistering all shortcuts',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}),
			unregisterAllGlobalShortcuts: () =>
				Effect.tryPromise({
					try: () => unregisterAll(),
					catch: (error) =>
						new RegisterShortcutsError({
							title: 'Error unregistering all shortcuts',
							description: error instanceof Error ? error.message : undefined,
							error,
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
							title: 'Error registering shortcut',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}),
			registerGlobalShortcut: ({ shortcut, callback }) =>
				Effect.tryPromise({
					try: () => register(shortcut, callback),
					catch: (error) =>
						new RegisterShortcutsError({
							title: window.__TAURI__
								? 'Error registering shortcut. Please make sure it is a valid Electron keyboard shortcut.'
								: 'Error registering shortcut.',
							description: error instanceof Error ? error.message : undefined,
							error,
						}),
				}),
		};
	}),
);
