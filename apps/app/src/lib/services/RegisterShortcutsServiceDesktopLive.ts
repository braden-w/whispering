import { WhisperingError } from '@repo/shared';
import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import { Effect, Layer } from 'effect';
import hotkeys from 'hotkeys-js';
import { RegisterShortcutsService } from './RegisterShortcutsService';

export const RegisterShortcutsDesktopLive = Layer.effect(
	RegisterShortcutsService,
	Effect.gen(function* () {
		return {
			isGlobalShortcutEnabled: true,
			defaultLocalShortcut: 'space',
			defaultGlobalShortcut: 'CommandOrControl+Shift+;',
			unregisterAllLocalShortcuts: Effect.try({
				try: () => hotkeys.unbind(),
				catch: (error) =>
					new WhisperingError({
						title: 'Error unregistering all shortcuts',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}),
			unregisterAllGlobalShortcuts: Effect.tryPromise({
				try: () => unregisterAll(),
				catch: (error) =>
					new WhisperingError({
						title: 'Error unregistering all shortcuts',
						description: error instanceof Error ? error.message : 'Please try again.',
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
						new WhisperingError({
							title: 'Error registering local shortcut',
							description:
								error instanceof Error
									? error.message
									: 'Please make sure it is a valid keyboard shortcut.',
							error,
						}),
				}),
			registerGlobalShortcut: ({ shortcut, callback }) =>
				Effect.tryPromise({
					try: () => register(shortcut, callback),
					catch: (error) =>
						new WhisperingError({
							title:
								'Error registering global shortcut. Please make sure it is a valid Electron keyboard shortcut.',
							description:
								error instanceof Error
									? error.message
									: 'You can find more information in the console.',
							error,
						}),
				}),
		};
	}),
);
