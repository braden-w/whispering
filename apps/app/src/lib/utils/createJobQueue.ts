import { Effect, Option, Queue } from 'effect';

export const createJobQueue = <T extends Effect.Effect<any>>() =>
	Effect.gen(function* (_) {
		const queue = yield* Queue.unbounded<T>();

		let isProcessing = false;
		const processJobQueue: Effect.Effect<
			void,
			Effect.Effect.Error<T>,
			never
		> = Effect.gen(function* () {
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
			queue,
			addJobToQueue: (job: T) =>
				Effect.gen(function* () {
					yield* Queue.offer(queue, job);
					yield* processJobQueue;
				}),
		};
	});
