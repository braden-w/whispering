import { ToastService, type WhisperingErrorProperties } from '@repo/shared';
import { Console, Effect } from 'effect';
import { ToastServiceLive } from './ToastServiceLive';

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
			yield* Console.error(error.error instanceof Error ? error.error.message : error.error);
			return options?.defaultValue;
		}).pipe(Effect.provide(ToastServiceLive)),
	);
