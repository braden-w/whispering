import { register, unregisterAll } from '@tauri-apps/api/globalShortcut';
import { Effect, Layer, Option, Queue } from 'effect';
import { RegisterShortcutsError } from '../../services/register-shortcuts';
import { RegisterShortcutsService } from '../../services/register-shortcuts';

type RegisterShortcutJob = Effect.Effect<void, RegisterShortcutsError>;

export const RegisterShortcutsDesktopLive = Layer.effect(
	RegisterShortcutsService,
	Effect.gen(function* () {
		const queue = yield* Queue.unbounded<RegisterShortcutJob>();
		let isProcessing = false;
		const processQueue = Effect.gen(function* () {
			if (isProcessing) return;
			isProcessing = true;
			while (isProcessing) {
				const job = yield* Queue.take(queue);
				yield* job;
				if (Option.isNone(yield* Queue.poll(queue))) {
					isProcessing = false;
				}
			}
		});
		return {
			defaultShortcut: 'CommandOrControl+Shift+;',
			unregisterAll: () =>
				Effect.gen(function* () {
					const job: RegisterShortcutJob = Effect.tryPromise({
						try: () => unregisterAll(),
						catch: (error) =>
							new RegisterShortcutsError({
								message: 'Error unregistering all shortcuts',
								origError: error,
							}),
					});
					yield* Queue.offer(queue, job);
					yield* processQueue;
				}),
			register: ({ shortcut, callback }) =>
				Effect.gen(function* () {
					const job: RegisterShortcutJob = Effect.tryPromise({
						try: () => register(shortcut, callback),
						catch: (error) =>
							new RegisterShortcutsError({
								message: 'Error registering shortcut',
								origError: error,
							}),
					});
					yield* Queue.offer(queue, job);
					yield* processQueue;
				}),
		};
	}),
);
