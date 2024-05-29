import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
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
			defaultShortcut: 'CommandOrControl+Shift+;',
			unregisterAll: () =>
				Effect.tryPromise({
					try: () => unregisterAll(),
					catch: (error) =>
						new RegisterShortcutsError({
							renderAsToast: () => toast.error('Error unregistering all shortcuts'),
							origError: error,
						}),
				}),
			register: ({ shortcut, callback }) =>
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
