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
			while (true) {
				const maybeJob = yield* Queue.poll(queue);
				if (Option.isNone(maybeJob)) break;
				const job = yield* maybeJob;
				yield* job;
			}
			isProcessing = false;
		});
		return {
			registerShortcut: (shortcut, callback) =>
				Effect.gen(function* () {
					const job: RegisterShortcutJob = Effect.tryPromise({
						try: async () => {
							await unregisterAll();
							await register(shortcut, callback);
						},
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
