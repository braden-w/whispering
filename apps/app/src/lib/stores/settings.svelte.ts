import { toast } from '$lib/services/ToastService';
import { renderErrorAsToast } from '$lib/services/renderErrorAsToast';
import { createJobQueue } from '$lib/utils/createJobQueue';
import { createPersistedState } from '$lib/utils/createPersistedState.svelte';
import { Schema as S } from '@effect/schema';
import {
	WhisperingError,
	getDefaultSettings,
	settingsSchema,
} from '@repo/shared';
import { Effect } from 'effect';
import hotkeys from 'hotkeys-js';
import { recorder } from './recorder.svelte';

export const settings = createPersistedState({
	key: 'whispering-settings',
	schema: settingsSchema.pipe(S.mutable),
	defaultValue: getDefaultSettings('app'),
});

type RegisterShortcutJob = Effect.Effect<void>;

const unregisterAllLocalShortcuts = Effect.try({
	try: () => hotkeys.unbind(),
	catch: (error) =>
		new WhisperingError({
			title: 'Error unregistering all shortcuts',
			description: 'Please try again.',
			action: { type: 'more-details', error },
		}),
});

const unregisterAllGlobalShortcuts = Effect.tryPromise({
	try: async () => {
		if (!window.__TAURI_INTERNALS__) return;
		const { unregisterAll } = await import(
			'@tauri-apps/plugin-global-shortcut'
		);
		return await unregisterAll();
	},
	catch: (error) =>
		new WhisperingError({
			title: 'Error unregistering all shortcuts',
			description: 'Please try again.',
			action: { type: 'more-details', error },
		}),
});

const registerLocalShortcut = ({
	shortcut,
	callback,
}: {
	shortcut: string;
	callback: () => void;
}) =>
	Effect.gen(function* () {
		yield* unregisterAllLocalShortcuts;
		yield* Effect.try({
			try: () =>
				hotkeys(shortcut, (event, handler) => {
					// Prevent the default refresh event under WINDOWS system
					event.preventDefault();
					callback();
				}),
			catch: (error) =>
				new WhisperingError({
					title: 'Error registering local shortcut',
					description: 'Please make sure it is a valid keyboard shortcut.',
					action: { type: 'more-details', error },
				}),
		});
	});

const registerGlobalShortcut = ({
	shortcut,
	callback,
}: {
	shortcut: string;
	callback: () => void;
}) =>
	Effect.gen(function* () {
		yield* unregisterAllGlobalShortcuts;
		yield* Effect.tryPromise({
			try: async () => {
				if (!window.__TAURI_INTERNALS__) return;
				const { register } = await import('@tauri-apps/plugin-global-shortcut');
				return await register(shortcut, (event) => {
					if (event.state === 'Pressed') {
						callback();
					}
				});
			},
			catch: (error) =>
				new WhisperingError({
					title: 'Error registering global shortcut.',
					description:
						'Please make sure it is a valid Electron keyboard shortcut.',
					action: { type: 'more-details', error },
				}),
		});
	});

export const registerShortcuts = Effect.gen(function* () {
	const jobQueue = yield* createJobQueue<RegisterShortcutJob>();

	const initialSilentJob = Effect.gen(function* () {
		yield* unregisterAllLocalShortcuts;
		yield* unregisterAllGlobalShortcuts;
		yield* registerLocalShortcut({
			shortcut: settings.value.currentLocalShortcut,
			callback: recorder.toggleRecording,
		});
		yield* registerGlobalShortcut({
			shortcut: settings.value.currentGlobalShortcut,
			callback: recorder.toggleRecording,
		});
	}).pipe(Effect.catchAll(renderErrorAsToast));

	jobQueue.addJobToQueue(initialSilentJob).pipe(Effect.runPromise);

	return {
		registerLocalShortcut: ({
			shortcut,
			callback,
		}: {
			shortcut: string;
			callback: () => void;
		}) =>
			Effect.gen(function* () {
				const job = Effect.gen(function* () {
					yield* unregisterAllLocalShortcuts;
					yield* registerLocalShortcut({ shortcut, callback });
					yield* toast({
						variant: 'success',
						title: `Local shortcut set to ${shortcut}`,
						description: 'Press the shortcut to start recording',
					});
				}).pipe(Effect.catchAll(renderErrorAsToast));
				jobQueue.addJobToQueue(job).pipe(Effect.runPromise);
			}).pipe(Effect.runSync),
		registerGlobalShortcut: ({
			shortcut,
			callback,
		}: {
			shortcut: string;
			callback: () => void;
		}) =>
			Effect.gen(function* () {
				if (!window.__TAURI_INTERNALS__) return;
				const job = Effect.gen(function* () {
					yield* unregisterAllGlobalShortcuts;
					yield* registerGlobalShortcut({ shortcut, callback });
					yield* toast({
						variant: 'success',
						title: `Global shortcut set to ${shortcut}`,
						description: 'Press the shortcut to start recording',
					});
				}).pipe(Effect.catchAll(renderErrorAsToast));
				jobQueue.addJobToQueue(job).pipe(Effect.runPromise);
			}).pipe(Effect.runSync),
	};
}).pipe(Effect.runSync);
