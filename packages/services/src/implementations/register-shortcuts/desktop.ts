import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import hotkeys from 'hotkeys-js';
import { toast } from 'svelte-sonner';
import { Effect, Layer } from 'effect';
import {
	RegisterShortcutsError,
	RegisterShortcutsService,
} from '../../services/register-shortcuts';
import ErrorRegisteringShortcutDesktop from './ErrorRegisteringShortcutDesktop.svelte';

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
							renderAsToast: () => toast.error('Error unregistering all shortcuts'),
							origError: error,
						}),
				}),
			unregisterAllGlobalShortcuts: () =>
				Effect.tryPromise({
					try: () => unregisterAll(),
					catch: (error) =>
						new RegisterShortcutsError({
							renderAsToast: () => toast.error('Error unregistering all shortcuts'),
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
							renderAsToast: () => toast.error('Error registering shortcut'),
							origError: error,
						}),
				}),
			registerGlobalShortcut: ({ shortcut, callback }) =>
				Effect.tryPromise({
					try: () => register(shortcut, callback),
					catch: (error) =>
						new RegisterShortcutsError({
							renderAsToast: () =>
								window.__TAURI__
									? toast.error(ErrorRegisteringShortcutDesktop)
									: toast.error('Error registering shortcut.'),
							origError: error,
						}),
				}),
		};
	}),
);
