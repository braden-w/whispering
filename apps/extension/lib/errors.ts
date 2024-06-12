import { ToastService, type WhisperingErrorProperties } from '@repo/shared';
import { Data, Effect } from 'effect';
import { ToastServiceLive } from './services/ToastServiceLive';

export class BackgroundServiceWorkerError extends Data.TaggedError(
	'BackgroundServiceWorkerError',
)<WhisperingErrorProperties> {}

export const catchErrorsAsToast = <
	E extends Effect.Effect<any, WhisperingErrorProperties, never>,
	A = Effect.Effect.Success<E>,
>(
	program: E,
	options?: { defaultValue?: A; toastId?: number | string },
): Effect.Effect<A, never, never> =>
	Effect.catchAll(program, (error) =>
		Effect.gen(function* () {
			const toast = yield* ToastService;
			toast.error({
				id: options?.toastId,
				title: error.title,
				description: error.description,
				action: error.action,
			});
			return options?.defaultValue;
		}).pipe(Effect.provide(ToastServiceLive)),
	);
