import { Effect, Either } from 'effect';
import { toast } from 'svelte-sonner';

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
	defaultValue?: A,
): Effect.Effect<A, never, never> =>
	Effect.gen(function* () {
		const failureOrSuccess = yield* Effect.either(program);
		if (Either.isLeft(failureOrSuccess)) {
			const error = failureOrSuccess.left;
			toast.error(error.title, {
				description: error.description,
				action: error.action,
			});
			return defaultValue;
		} else {
			return failureOrSuccess.right;
		}
	});
