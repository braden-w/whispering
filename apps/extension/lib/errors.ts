import { ToastService, type WhisperingErrorProperties } from '@repo/shared';
import { Data, Effect } from 'effect';
import { ToastServiceLive } from './services/ToastServiceLive';

export class WhisperingError extends Data.TaggedError(
	'WhisperingError',
)<WhisperingErrorProperties> {}

export const renderErrorAsToast = <E extends WhisperingError>(
	error: E,
	options?: { toastId?: number | string },
) =>
	Effect.gen(function* () {
		const { toast } = yield* ToastService;
		toast({
			variant: 'error',
			id: options?.toastId,
			title: error.title,
			description: error.description,
			action: error.action,
		});
		return yield* error;
	}).pipe(Effect.provide(ToastServiceLive));
