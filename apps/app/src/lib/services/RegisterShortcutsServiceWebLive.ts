import { WhisperingError } from '@repo/shared';
import { Effect, Layer } from 'effect';
import hotkeys from 'hotkeys-js';
import { RegisterShortcutsService } from './RegisterShortcutsService';

export const RegisterShortcutsWebLive = Layer.effect(
	RegisterShortcutsService,
	Effect.gen(function* () {
		return {
			isGlobalShortcutEnabled: false,
			unregisterAllLocalShortcuts: Effect.try({
				try: () => hotkeys.unbind(),
				catch: (error) =>
					new WhisperingError({
						title: 'Error unregistering all shortcuts',
						description: error instanceof Error ? error.message : 'Please try again.',
						error,
					}),
			}),
			unregisterAllGlobalShortcuts: Effect.try({
				try: () => hotkeys.unbind(),
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
				Effect.try({
					try: () =>
						hotkeys(shortcut, function (event, handler) {
							// Prevent the default refresh event under WINDOWS system
							event.preventDefault();
							callback();
						}),
					catch: (error) =>
						new WhisperingError({
							title: 'Error registering global shortcut',
							description:
								error instanceof Error
									? error.message
									: 'Please make sure it is a valid keyboard shortcut.',
							error,
						}),
				}),
		};
	}),
);
