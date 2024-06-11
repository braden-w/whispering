import { Console, Effect, Either } from 'effect';
import { toast } from 'sonner';

export type WhisperingErrorProperties = {
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	error?: unknown;
};

export const catchErrorsAsToast = <
	E extends Effect.Effect<any, WhisperingErrorProperties, never>,
	A = Effect.Effect.Success<E>,
>(
	program: E,
	options?: { defaultValue?: A; toastId?: number | string },
): Effect.Effect<A, never, never> =>
	Effect.gen(function* () {
		const failureOrSuccess = yield* Effect.either(program);
		if (Either.isLeft(failureOrSuccess)) {
			const error = failureOrSuccess.left;
			yield* Console.error(error.error as any);
			toast.error(error.title, {
				id: options?.toastId,
				description: error.description,
				action: error.action,
			});
			return options?.defaultValue;
		} else {
			return failureOrSuccess.right;
		}
	});
